import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { LaunchTemplate, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export class ElbStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const labsVpc = Vpc.fromLookup(this, 'labsVpc', {
      vpcName: 'labs-vpc',
    });

    // Create a load balancer
    const labsAlbSg = new SecurityGroup(this, 'labsAlbSg', {
      vpc: labsVpc,
      securityGroupName: 'labs-alb-sg',
      allowAllOutbound: true,
      description: 'Allow HTTP and HTTPS traffic',
    });
    labsAlbSg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP traffic');
    labsAlbSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow HTTPS traffic');

    const labsAlb = new ApplicationLoadBalancer(this, 'labsAlb', {
      vpc: labsVpc,
      loadBalancerName: 'labs-alb',
      internetFacing: true,
      securityGroup: labsAlbSg,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });

    // Create a target group for the load balancer
    const labsAlbTg = new ApplicationTargetGroup(this, 'labsAlbTg', {
      vpc: labsVpc,
      targetGroupName: 'labs-alb-tg',
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      targetType: TargetType.INSTANCE,
    });
    const labsAlbHttpListener = labsAlb.addListener('labsAlbTg', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
    });
    labsAlbHttpListener.addTargetGroups('labsAlbTg', {
      targetGroups: [labsAlbTg],
    }); // Add the target group to the load balancer listeners

    // Create an auto scaling group
    const labsEc2LaunchTemplate = LaunchTemplate.fromLaunchTemplateAttributes(
      this,
      'labsEc2LaunchTemplate',
      {
        launchTemplateName: 'labs-ec2-launch-template',
        versionNumber: '1',
      },
    );
    const labsAlbAsg = new AutoScalingGroup(this, 'labsAlbAsg', {
      vpc: labsVpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      autoScalingGroupName: 'labs-alb-asg',
      minCapacity: 2,
      // desiredCapacity: 3,
      maxCapacity: 5,
      launchTemplate: labsEc2LaunchTemplate,
    });
    // TODO: Must do manually in the console
    // labsAlbAsg.attachToApplicationTargetGroup(labsAlbTg);

    new CfnOutput(this, 'albDnsName', {
      key: 'AlbDnsName',
      exportName: 'AlbDnsName',
      value: labsAlb.loadBalancerDnsName,
      description: 'The DNS name of the ALB',
    });
  }
}
