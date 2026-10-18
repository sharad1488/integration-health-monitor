import os

class SpringBoot:

    base_url: str


    @classmethod
    def from_springboot_config(cls) -> "SpringBoot":
        return cls(base_url= os.getenv("SPRING_BOOT_BASE_URL", ""))


