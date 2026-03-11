terraform {
  backend "s3" {
    bucket       = "tf-state-lab3-oliinyk-denys-11"
    key          = "env/dev/var-11.tfstate"
    region       = "eu-central-1"
    encrypt      = true
    use_lockfile = true
  }
}
