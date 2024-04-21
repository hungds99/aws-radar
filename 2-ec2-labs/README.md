## AWS Elastic Cloud Computing (EC2)

### Note

1. Instance metadata and user data

   - **Instance user data**
     - Run at launch time
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
