from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.packages.models import GuestPackage, PromoCode
from apps.events.models import EventDesign

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed initial data: packages, promo codes, designs, admin user'

    def handle(self, *args, **options):
        self._seed_packages()
        self._seed_promo_codes()
        self._seed_designs()
        self._seed_admin()
        self.stdout.write(self.style.SUCCESS('Seed data created successfully'))

    def _seed_packages(self):
        packages = [
            {'name_ar': 'الباقة المجانية', 'name_en': 'Free Package', 'min_guests': 0, 'max_guests': 3, 'price_sar': 0},
            {'name_ar': 'الباقة الأساسية', 'name_en': 'Basic Package', 'min_guests': 35, 'max_guests': 250, 'price_sar': 35},
            {'name_ar': 'الباقة المتقدمة', 'name_en': 'Advanced Package', 'min_guests': 80, 'max_guests': 550, 'price_sar': 80},
        ]
        for pkg in packages:
            obj, created = GuestPackage.objects.get_or_create(
                name_en=pkg['name_en'],
                defaults=pkg
            )
            if created:
                self.stdout.write(f"  Created package: {obj.name_en}")

    def _seed_promo_codes(self):
        codes = [
            {'code': 'WELCOME10', 'discount_percent': 10, 'max_uses': 100},
            {'code': 'HALF50', 'discount_percent': 50, 'max_uses': 10},
        ]
        for c in codes:
            obj, created = PromoCode.objects.get_or_create(code=c['code'], defaults=c)
            if created:
                self.stdout.write(f"  Created promo: {obj.code}")

    def _seed_designs(self):
        event_types = ['women_wedding', 'graduation', 'men_wedding', 'newborn', 'opening', 'birthday']
        names = {
            'women_wedding': ('حفل زفاف', 'Wedding'),
            'graduation': ('تخرج', 'Graduation'),
            'men_wedding': ('عرس', "Men's Wedding"),
            'newborn': ('مولود جديد', 'New Born'),
            'opening': ('افتتاح', 'Opening'),
            'birthday': ('عيد ميلاد', 'Birthday'),
        }
        default_positions = {
            'name': {'x': 50, 'y': 40},
            'date': {'x': 50, 'y': 55},
            'location': {'x': 50, 'y': 65},
            'welcome': {'x': 50, 'y': 25},
        }
        for i, et in enumerate(event_types):
            for variant in range(1, 3):
                name_ar, name_en = names[et]
                obj, created = EventDesign.objects.get_or_create(
                    event_type=et,
                    name_en=f"{name_en} {variant}",
                    is_premade=True,
                    defaults={
                        'name_ar': f"{name_ar} {variant}",
                        'text_positions': default_positions,
                    }
                )
                if created:
                    self.stdout.write(f"  Created design: {obj.name_en}")

    def _seed_admin(self):
        phone = '+966500000001'
        if not User.objects.filter(phone=phone).exists():
            user = User.objects.create_superuser(
                phone=phone,
                password='Admin1234',
                full_name='Admin User',
            )
            user.is_admin = True
            user.save()
            self.stdout.write(f"  Created admin: {phone} / Admin1234")
        else:
            self.stdout.write("  Admin already exists")
