## AWS Elastic Cloud Computing (EC2)

### Note

1. Instance metadata and user data

   - **Instance user data**
     - Run at launch time
     - Install software/updates....
   - **Instance metadata info**
     - IMDSv2: Instance Metadata Service v2
     - Retrieve using http://169.254.169.254/latest/meta-data/

2. Public IP vs Elastic IP

   - **Public IP:**
     - Dynamic -> Change every time when instance stop and start
     - A public IP assigned from Amazon's pool of IPv4
     - Not associate with account and Unlimited
   - **Elastic IP:**
     - Static IP -> Don't change when instance stop and start
     - Associate with account and Limit 5 IP

3. Elastic Network Interface (ENI)

   - Allow EC2 can connect to AWS network
   - A EC2 instance -> attached a ENI

4. Storage

   - Network-attached: EBS (Elastic Block Storage) and EFS (Elastic File Storage)
   - Instance storage

5. Security Groups

   - Define rule for your traffic inbound/outbound to EC2 instance
   - Can be attached multiple instances

6. Instance type

   - On demand: Pay as you go
   - Revered instance (1-3 years)
   - Savings plans
   - Spot instance
   - Dedicated instance/host - license
