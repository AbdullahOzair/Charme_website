# backend/config/admin_site.py
from django.contrib.admin import AdminSite


class CharmeAdminSite(AdminSite):
    site_header = "Charmé Admin"
    site_title = "Charmé"
    index_title = "Asset Management Dashboard"


charme_admin = CharmeAdminSite(name='charme_admin')
