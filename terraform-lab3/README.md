# Terraform IaC Lab 3

Розгортання EC2 вебсервера (Apache2, Ubuntu 24.04) у AWS VPC за допомогою Terraform.

## Передумови

- Terraform `>= 1.10.0`
- AWS CLI налаштований (`aws configure`)
- S3 бакет `tf-state-lab3-[surname]-[name]-[num]`

## Використання

```bash
# Ініціалізація провайдерів та бекенду
terraform init

# Розгортання інфраструктури
terraform apply

# Знищення інфраструктури
terraform destroy
```

Після `apply` Terraform виведе публічну IP-адресу та URL вебсайту.
