# Enable and Disbale detailed monitoring of EC2

- Enable: `aws ec2 monitor-instances --instance-ids $list_instance_id`
- Disbale: `aws ec2 unmonitor-instances --instance-id $list_instance_id`
- Lauch Configuration: `aws ec2 run-instances $config --monitoring Enabled=true`



