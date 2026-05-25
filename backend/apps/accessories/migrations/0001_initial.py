# backend/apps/accessories/migrations/0001_initial.py
import django.core.validators
import django.db.models.deletion
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Material',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=120, unique=True)),
                ('price_modifier', models.DecimalField(
                    decimal_places=2,
                    default=Decimal('1.00'),
                    help_text='Multiplier applied to base price',
                    max_digits=6,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                )),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='ColorPalette',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('hex_code', models.CharField(help_text='Hex color code, e.g. #FF5733', max_length=7)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Bead',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('image', models.ImageField(blank=True, null=True, upload_to='beads/')),
                ('model_file', models.FileField(blank=True, null=True, upload_to='beads/models/')),
                ('price', models.DecimalField(
                    decimal_places=2,
                    max_digits=10,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                )),
                ('stock', models.PositiveIntegerField(default=0)),
                ('size_mm', models.DecimalField(
                    decimal_places=2,
                    help_text='Bead size in millimeters',
                    max_digits=5,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.1'))],
                )),
                ('shape', models.CharField(
                    choices=[('round', 'Round'), ('oval', 'Oval'), ('cube', 'Cube'), ('faceted', 'Faceted')],
                    default='round',
                    max_length=10,
                )),
                ('texture', models.ImageField(blank=True, null=True, upload_to='beads/textures/')),
                ('thumbnail', models.ImageField(blank=True, null=True, upload_to='beads/thumbnails/')),
                ('is_active', models.BooleanField(default=True)),
                ('material', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='beads',
                    to='accessories.material',
                )),
                ('color', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='beads',
                    to='accessories.colorpalette',
                )),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Chain',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('image', models.ImageField(blank=True, null=True, upload_to='chains/')),
                ('model_file', models.FileField(blank=True, null=True, upload_to='chains/models/')),
                ('price', models.DecimalField(
                    decimal_places=2,
                    max_digits=10,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                )),
                ('stock', models.PositiveIntegerField(default=0)),
                ('thickness_mm', models.DecimalField(
                    decimal_places=2,
                    help_text='Chain thickness in millimeters',
                    max_digits=5,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.1'))],
                )),
                ('compatible_lengths', models.JSONField(
                    default=list,
                    help_text='List of compatible bracelet lengths in mm',
                )),
                ('thumbnail', models.ImageField(blank=True, null=True, upload_to='chains/thumbnails/')),
                ('is_active', models.BooleanField(default=True)),
                ('material', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='chains',
                    to='accessories.material',
                )),
                ('color', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='chains',
                    to='accessories.colorpalette',
                )),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Charm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('image', models.ImageField(blank=True, null=True, upload_to='charms/')),
                ('model_file', models.FileField(blank=True, null=True, upload_to='charms/models/')),
                ('price', models.DecimalField(
                    decimal_places=2,
                    max_digits=10,
                    validators=[django.core.validators.MinValueValidator(Decimal('0.00'))],
                )),
                ('stock', models.PositiveIntegerField(default=0)),
                ('thumbnail', models.ImageField(blank=True, null=True, upload_to='charms/thumbnails/')),
                ('preview_image', models.ImageField(blank=True, null=True, upload_to='charms/previews/')),
                ('is_active', models.BooleanField(default=True)),
                ('material', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='charms',
                    to='accessories.material',
                )),
                ('color', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='charms',
                    to='accessories.colorpalette',
                )),
            ],
            options={
                'ordering': ['name'],
            },
        ),
    ]
