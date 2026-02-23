// مفاتيح التخزين في LocalStorage
const LS_KEYS = {
  PROJECTS: 'mprojects',
  PAYMENTS: 'mpayments',
  INVOICES: 'minvoices',
  EXPENSES: 'mexpenses',
  LOANS: 'mloans'
};

// مصفوفات البيانات
let projects = [];
let payments = [];
let invoices = [];
let expenses = [];
let loans = [];

// تحميل البيانات من LocalStorage
function loadData() {
  projects = JSON.parse(localStorage.getItem(LS_KEYS.PROJECTS) || '[]');
  payments = JSON.parse(localStorage.getItem(LS_KEYS.PAYMENTS) || '[]');
  invoices = JSON.parse(localStorage.getItem(LS_KEYS.INVOICES) || '[]');
  expenses = JSON.parse(localStorage.getItem(LS_KEYS.EXPENSES) || '[]');
  loans = JSON.parse(localStorage.getItem(LS_KEYS.LOANS) || '[]');
}

// حفظ البيانات في LocalStorage
function saveData() {
  localStorage.setItem(LS_KEYS.PROJECTS, JSON.stringify(projects));
  localStorage.setItem(LS_KEYS.PAYMENTS, JSON.stringify(payments));
  localStorage.setItem(LS_KEYS.INVOICES, JSON.stringify(invoices));
  localStorage.setItem(LS_KEYS.EXPENSES, JSON.stringify(expenses));
  localStorage.setItem(LS_KEYS.LOANS, JSON.stringify(loans));
}

// توليد كود مشروع بسيط
function generateProjectCode() {
  return 'P' + (projects.length + 1).toString().padStart(3, '0');
}

// تحديث القوائم المنسدلة بالمشاريع
function refreshProjectSelects() {
  const selects = [
    document.getElementById('payment-project'),
    document.getElementById('invoice-project'),
    document.getElementById('expense-project'),
    document.getElementById('loan-project'),
    document.getElementById('report-project')
  ];

  selects.forEach((sel, index) => {
    if (!sel) return;
    const preserveFirst = (index === 2 || index === 3); // expense & loan keep first option
    const firstOption = preserveFirst ? sel.options[0] : null;
    sel.innerHTML = '';
    if (preserveFirst && firstOption) {
      sel.appendChild(firstOption);
    }
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.code;
      opt.textContent = `${p.code} - ${p.client}`;
      sel.appendChild(opt);
    });
  });
}

// حسابات المشاريع
function calcProjectTotals(projectCode) {
  const project = projects.find(p => p.code === projectCode);
  if (!project) return { income: 0, expenses: 0, invoicesTotal: 0, profit: 0 };

  const income = payments
    .filter(pay => pay.projectCode === projectCode)
    .reduce((sum, p) => sum + p.amount, 0);

  const invoicesTotal = invoices
    .filter(inv => inv.projectCode === projectCode)
    .reduce((sum, i) => sum + i.amount, 0);

  const exp = expenses
    .filter(ex => ex.projectCode === projectCode)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = invoicesTotal + exp;
  const profit = income - totalExpenses;

  return { income, expenses: totalExpenses, invoicesTotal, profit };
}

// تحديث جدول المشاريع
function renderProjects() {
  const tbody = document.getElementById('projects-table');
  tbody.innerHTML = '';
  projects.forEach(p => {
    const totals = calcProjectTotals(p.code);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.code}</td>
      <td>${p.client}</td>
      <td>${p.type}</td>
      <td>${p.value.toLocaleString()}</td>
      <td>${totals.income.toLocaleString()}</td>
      <td>${(p.value - totals.income).toLocaleString()}</td>
      <td>${totals.profit.toLocaleString()}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-action="delete-project" data-code="${p.code}">حذف</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderDashboardProjectsSummary();
  renderPL();
  renderDashboardTotals();
// تحديث إحصائيات Header
document.getElementById('header-projects-count').textContent = projects.length;
document.getElementById('header-total-profit').textContent = netProfit.toLocaleString();
}

// تحديث جدول المدفوعات
function renderPayments() {
  const tbody = document.getElementById('payments-table');
  tbody.innerHTML = '';
  payments.forEach(pay => {
    const project = projects.find(p => p.code === pay.projectCode);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${project ? project.code + ' - ' + project.client : ''}</td>
      <td>${pay.date}</td>
      <td>${pay.amount.toLocaleString()}</td>
      <td>${pay.method}</td>
      <td>${pay.note || ''}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-action="delete-payment" data-id="${pay.id}">حذف</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderProjects();
  renderDashboardTotals();
}

// تحديث جدول الفواتير
function renderInvoices() {
  const tbody = document.getElementById('invoices-table');
  tbody.innerHTML = '';
  invoices.forEach(inv => {
    const project = projects.find(p => p.code === inv.projectCode);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${project ? project.code + ' - ' + project.client : ''}</td>
      <td>${inv.date}</td>
      <td>${inv.number}</td>
      <td>${inv.supplier}</td>
      <td>${inv.amount.toLocaleString()}</td>
      <td>${inv.note || ''}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-action="delete-invoice" data-id="${inv.id}">حذف</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderProjects();
  renderDashboardTotals();
}

// تحديث جدول المصروفات
function renderExpenses() {
  const tbody = document.getElementById('expenses-table');
  tbody.innerHTML = '';
  expenses.forEach(ex => {
    const project = projects.find(p => p.code === ex.projectCode);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${project ? project.code + ' - ' + project.client : 'عام'}</td>
      <td>${ex.date}</td>
      <td>${ex.amount.toLocaleString()}</td>
      <td>${ex.type}</td>
      <td>${ex.note || ''}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-action="delete-expense" data-id="${ex.id}">حذف</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderProjects();
  renderDashboardTotals();
}

// تحديث جدول السلف
function renderLoans() {
  const tbody = document.getElementById('loans-table');
  tbody.innerHTML = '';
  loans.forEach(l => {
    const project = projects.find(p => p.code === l.projectCode);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${project ? project.code + ' - ' + project.client : 'عام'}</td>
      <td>${l.date}</td>
      <td>${l.amount.toLocaleString()}</td>
      <td>${l.reason || ''}</td>
      <td>${l.status}</td>
      <td><button class="btn btn-sm btn-outline-danger" data-action="delete-loan" data-id="${l.id}">حذف</button></td>
    `;
    tbody.appendChild(tr);
  });

  renderDashboardTotals();
}

// Dashboard: ملخص المشاريع
function renderDashboardProjectsSummary() {
  const tbody = document.getElementById('dash-projects-summary');
  tbody.innerHTML = '';
  projects.forEach(p => {
    const totals = calcProjectTotals(p.code);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.code} - ${p.client}</td>
      <td>${totals.income.toLocaleString()}</td>
      <td>${totals.expenses.toLocaleString()}</td>
      <td>${totals.profit.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Dashboard & PL: إجمالي الإيرادات والمصروفات والربح
function renderDashboardTotals() {
  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalInvoices = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) + totalInvoices;
  const totalLoansRemaining = loans
    .filter(l => l.status !== 'استرد بالكامل')
    .reduce((sum, l) => sum + l.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  document.getElementById('dash-total-income').textContent = totalIncome.toLocaleString();
  document.getElementById('dash-total-expenses').textContent = totalExpenses.toLocaleString();
  document.getElementById('dash-net-profit').textContent = netProfit.toLocaleString();
  document.getElementById('dash-remaining-loans').textContent = totalLoansRemaining.toLocaleString();

  document.getElementById('pl-total-income').textContent = totalIncome.toLocaleString();
  document.getElementById('pl-total-expenses').textContent = totalExpenses.toLocaleString();
  document.getElementById('pl-net-profit').textContent = netProfit.toLocaleString();
}

// PL جدول المشاريع
function renderPL() {
  const tbody = document.getElementById('pl-projects-table');
  tbody.innerHTML = '';
  projects.forEach(p => {
    const totals = calcProjectTotals(p.code);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.code} - ${p.client}</td>
      <td>${totals.income.toLocaleString()}</td>
      <td>${totals.expenses.toLocaleString()}</td>
      <td>${totals.profit.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

// التقرير التفصيلي لمشروع
function renderDetailedReport(projectCode) {
  const project = projects.find(p => p.code === projectCode);
  if (!project) {
    document.getElementById('report-content').innerHTML = '<p class="text-muted">اختر مشروع لعرض التقرير التفصيلي</p>';
    return;
  }

  const totals = calcProjectTotals(projectCode);
  const projectPayments = payments.filter(p => p.projectCode === projectCode);
  const projectInvoices = invoices.filter(i => i.projectCode === projectCode);
  const projectExpenses = expenses.filter(e => e.projectCode === projectCode);
  const projectLoans = loans.filter(l => l.projectCode === projectCode);

  let html = `
    <div class="card mb-3">
      <div class="card-header bg-primary text-white">
        <h5>تقرير تفصيلي: ${project.code} - ${project.client}</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <p><strong>نوع المشروع:</strong> ${project.type}</p>
            <p><strong>قيمة التعاقد:</strong> ${project.value.toLocaleString()} جنيه</p>
            <p><strong>تاريخ البدء:</strong> ${project.date}</p>
          </div>
          <div class="col-md-6">
            <p><strong>إجمالي المدفوع:</strong> ${totals.income.toLocaleString()} جنيه</p>
            <p><strong>المتبقي من العميل:</strong> ${(project.value - totals.income).toLocaleString()} جنيه</p>
            <p><strong>نسبة التحصيل:</strong> ${((totals.income / project.value) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-4">
        <div class="card text-bg-success">
          <div class="card-body">
            <h6>إجمالي الإيرادات</h6>
            <h4>${totals.income.toLocaleString()}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-bg-danger">
          <div class="card-body">
            <h6>إجمالي المصروفات</h6>
            <h4>${totals.expenses.toLocaleString()}</h4>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-bg-primary">
          <div class="card-body">
            <h6>صافي الربح</h6>
            <h4>${totals.profit.toLocaleString()}</h4>
          </div>
        </div>
      </div>
    </div>

    <h5 class="mt-4">مدفوعات العميل (${projectPayments.length})</h5>
    <table class="table table-sm table-bordered">
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>المبلغ</th>
          <th>الطريقة</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>
  `;

  projectPayments.forEach(p => {
    html += `
      <tr>
        <td>${p.date}</td>
        <td>${p.amount.toLocaleString()}</td>
        <td>${p.method}</td>
        <td>${p.note || '-'}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>

    <h5 class="mt-4">الفواتير (${projectInvoices.length}) - إجمالي: ${totals.invoicesTotal.toLocaleString()} جنيه</h5>
    <table class="table table-sm table-bordered">
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>رقم الفاتورة</th>
          <th>المورد</th>
          <th>المبلغ</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>
  `;

  projectInvoices.forEach(inv => {
    html += `
      <tr>
        <td>${inv.date}</td>
        <td>${inv.number}</td>
        <td>${inv.supplier}</td>
        <td>${inv.amount.toLocaleString()}</td>
        <td>${inv.note || '-'}</td>
      </tr>
    `;
  });

  const expensesTotal = projectExpenses.reduce((sum, e) => sum + e.amount, 0);

  html += `
      </tbody>
    </table>

    <h5 class="mt-4">المصروفات الأخرى (${projectExpenses.length}) - إجمالي: ${expensesTotal.toLocaleString()} جنيه</h5>
    <table class="table table-sm table-bordered">
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>النوع</th>
          <th>المبلغ</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>
  `;

  projectExpenses.forEach(ex => {
    html += `
      <tr>
        <td>${ex.date}</td>
        <td>${ex.type}</td>
        <td>${ex.amount.toLocaleString()}</td>
        <td>${ex.note || '-'}</td>
      </tr>
    `;
  });

  const loansTotal = projectLoans.reduce((sum, l) => sum + l.amount, 0);

  html += `
      </tbody>
    </table>

    <h5 class="mt-4">السلف الشخصية (${projectLoans.length}) - إجمالي: ${loansTotal.toLocaleString()} جنيه</h5>
    <table class="table table-sm table-bordered">
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>المبلغ</th>
          <th>السبب</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
  `;

  projectLoans.forEach(l => {
    html += `
      <tr>
        <td>${l.date}</td>
        <td>${l.amount.toLocaleString()}</td>
        <td>${l.reason || '-'}</td>
        <td>${l.status}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  document.getElementById('report-content').innerHTML = html;
}

// التنقل بين الصفحات
function setupNavigation() {
  const buttons = document.querySelectorAll('.list-group-item');
  const pages = document.querySelectorAll('.page');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-page');
      pages.forEach(p => {
        if (p.id === 'page-' + target) {
          p.classList.remove('d-none');
        } else {
          p.classList.add('d-none');
        }
      });
    });
  });
}

// إضافة مشروع
function setupProjectForm() {
  const form = document.getElementById('project-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const client = document.getElementById('project-client').value.trim();
    const type = document.getElementById('project-type').value.trim();
    const value = parseFloat(document.getElementById('project-value').value) || 0;
    const date = document.getElementById('project-date').value;

    const project = {
      code: generateProjectCode(),
      client,
      type,
      value,
      date
    };
    projects.push(project);
    saveData();
    refreshProjectSelects();
    renderProjects();
    form.reset();
  });

  // حذف مشروع
  document.getElementById('projects-table').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action="delete-project"]');
    if (!btn) return;
    const code = btn.getAttribute('data-code');
    if (!confirm('حذف المشروع سيحذف كل البيانات المرتبطة به، متأكد؟')) return;
    projects = projects.filter(p => p.code !== code);
    payments = payments.filter(p => p.projectCode !== code);
    invoices = invoices.filter(i => i.projectCode !== code);
    expenses = expenses.filter(e2 => e2.projectCode !== code);
    loans = loans.filter(l => l.projectCode !== code);
    saveData();
    refreshProjectSelects();
    renderProjects();
    renderPayments();
    renderInvoices();
    renderExpenses();
    renderLoans();
  });
}

// إضافة دفعة
function setupPaymentForm() {
  const form = document.getElementById('payment-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const projectCode = document.getElementById('payment-project').value;
    const date = document.getElementById('payment-date').value;
    const amount = parseFloat(document.getElementById('payment-amount').value) || 0;
    const method = document.getElementById('payment-method').value;
    const note = document.getElementById('payment-note').value.trim();

    const pay = {
      id: Date.now(),
      projectCode,
      date,
      amount,
      method,
      note
    };
    payments.push(pay);
    saveData();
    renderPayments();
    form.reset();
  });

  // حذف دفعة
  document.getElementById('payments-table').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action="delete-payment"]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    payments = payments.filter(p => p.id !== id);
    saveData();
    renderPayments();
  });
}

// إضافة فاتورة
function setupInvoiceForm() {
  const form = document.getElementById('invoice-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const projectCode = document.getElementById('invoice-project').value;
    const date = document.getElementById('invoice-date').value;
    const number = document.getElementById('invoice-number').value.trim();
    const supplier = document.getElementById('invoice-supplier').value.trim();
    const amount = parseFloat(document.getElementById('invoice-amount').value) || 0;
    const note = document.getElementById('invoice-note').value.trim();

    const inv = {
      id: Date.now(),
      projectCode,
      date,
      number,
      supplier,
      amount,
      note
    };
    invoices.push(inv);
    saveData();
    renderInvoices();
    form.reset();
  });

  // حذف فاتورة
  document.getElementById('invoices-table').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action="delete-invoice"]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    invoices = invoices.filter(i => i.id !== id);
    saveData();
    renderInvoices();
  });
}

// إضافة مصروف
function setupExpenseForm() {
  const form = document.getElementById('expense-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const projectCode = document.getElementById('expense-project').value;
    const date = document.getElementById('expense-date').value;
    const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
    const type = document.getElementById('expense-type').value;
    const note = document.getElementById('expense-note').value.trim();

    const ex = {
      id: Date.now(),
      projectCode: projectCode || null,
      date,
      amount,
      type,
      note
    };
    expenses.push(ex);
    saveData();
    renderExpenses();
    form.reset();
  });

  // حذف مصروف
  document.getElementById('expenses-table').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action="delete-expense"]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    expenses = expenses.filter(ex => ex.id !== id);
    saveData();
    renderExpenses();
  });
}

// إضافة سلفة
function setupLoanForm() {
  const form = document.getElementById('loan-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const projectCode = document.getElementById('loan-project').value;
    const date = document.getElementById('loan-date').value;
    const amount = parseFloat(document.getElementById('loan-amount').value) || 0;
    const reason = document.getElementById('loan-reason').value.trim();
    const status = document.getElementById('loan-status').value;

    const loan = {
      id: Date.now(),
      projectCode: projectCode || null,
      date,
      amount,
      reason,
      status
    };
    loans.push(loan);
    saveData();
    renderLoans();
    form.reset();
  });

  // حذف سلفة
  document.getElementById('loans-table').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action="delete-loan"]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));
    loans = loans.filter(l => l.id !== id);
    saveData();
    renderLoans();
  });
}

// إعداد التقارير التفصيلية
function setupReports() {
  const reportSelect = document.getElementById('report-project');
  reportSelect.addEventListener('change', () => {
    const projectCode = reportSelect.value;
    renderDetailedReport(projectCode);
  });
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupNavigation();
  setupProjectForm();
  setupPaymentForm();
  setupInvoiceForm();
  setupExpenseForm();
  setupLoanForm();
  setupReports();
  refreshProjectSelects();
  renderProjects();
  renderPayments();
  renderInvoices();
  renderExpenses();
  renderLoans();
  renderDashboardTotals();
});
