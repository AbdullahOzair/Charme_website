from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accessories', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='bead',
            name='bead_material_type',
            field=models.CharField(
                choices=[
                    ('glass',   'Glass'),
                    ('crystal', 'Crystal / Gemstone'),
                    ('stone',   'Stone / Jade'),
                    ('metal',   'Metal'),
                    ('resin',   'Resin / Acrylic'),
                    ('pearl',   'Pearl'),
                    ('wood',    'Wood'),
                    ('ceramic', 'Ceramic'),
                    ('other',   'Other'),
                ],
                default='glass',
                max_length=10,
                help_text='Physical material of the bead — drives 3D rendering (transmission, IOR, metalness)',
            ),
        ),
        migrations.AddField(
            model_name='bead',
            name='transparency',
            field=models.CharField(
                choices=[
                    ('transparent', 'Transparent'),
                    ('translucent', 'Translucent'),
                    ('opaque',      'Opaque'),
                ],
                default='translucent',
                max_length=12,
                help_text='Transparency level for 3D rendering',
            ),
        ),
    ]
