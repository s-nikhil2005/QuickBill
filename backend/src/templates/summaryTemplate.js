module.exports = (from, to, invoices, totals) => `
<style>
  body { font-family: Arial; padding:20px; }
  h1, h2 { text-align:center; }
  table { width:100%; border-collapse:collapse; margin-top:20px; }
  th, td { border:1px solid #ccc; padding:8px; text-align:left; }
  .total-box { margin-top:20px; font-size:18px; }
</style>

<h1>QuickBill – Invoice Summary</h1>
<h2>${from} to ${to}</h2>

<div class="total-box">
  Total Invoices: ${totals.count}<br/>
  Total Revenue: ₹${totals.revenue}<br/>
  Total Tax: ₹${totals.tax}<br/>
  Total Discount: ₹${totals.discount}<br/>
</div>

<table>
  <tr>
    <th>ID</th>
    <th>Date</th>
    <th>Customer</th>
    <th>Total</th>
  </tr>
  ${invoices.map(inv => `
    <tr>
      <td>${inv.id}</td>
      <td>${inv.created_at}</td>
      <td>${inv.customer_name}</td>
      <td>₹${inv.total}</td>
    </tr>
  `).join("")}
</table>
`;
