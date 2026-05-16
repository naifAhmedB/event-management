import openpyxl
import io
from django.http import HttpResponse


def generate_invitee_template():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Invitees'
    ws.append(['Name', 'Phone'])
    ws.append(['مثال - محمد أحمد', '+966501234567'])
    ws.column_dimensions['A'].width = 30
    ws.column_dimensions['B'].width = 20
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    response = HttpResponse(
        buffer.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="invitees_template.xlsx"'
    return response
