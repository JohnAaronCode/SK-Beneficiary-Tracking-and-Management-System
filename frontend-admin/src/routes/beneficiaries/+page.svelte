<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';
  import * as XLSX from 'xlsx';
  import FileSpreadsheet from 'lucide-svelte/icons/file-spreadsheet';
  import PenLine from 'lucide-svelte/icons/pen-line';
  import Upload from 'lucide-svelte/icons/upload';
  import Download from 'lucide-svelte/icons/download';
  import X from 'lucide-svelte/icons/x';
  import UserCheck from 'lucide-svelte/icons/user-check';
  import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
  import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
  import Search from 'lucide-svelte/icons/search';
  import Users from 'lucide-svelte/icons/users';

  interface Beneficiary {
    id: string | number;
    full_name: string;
    address: string;
    contact: string;
    program_id: string | number;
    program_title: string;
    category: string;
    received_at: string;
  }
  interface Program { id: string | number; title: string; }

  let beneficiaries = $state<Beneficiary[]>([]);
  let programs = $state<Program[]>([]);
  let filterProgram = $state('');
  let search = $state('');
  let loading = $state(true);

  // ── Manual Encode Modal State ──
  let showManualForm = $state(false);
  let manualForm = $state({
    full_name: '', address: '', age: '', contact: '',
    barangay: '', notes: '', program_id: '',
  });
  let manualLoading = $state(false);
  let manualError = $state('');
  let manualSuccess = $state('');
  let manualWarning = $state('');

  // ── Excel Import Modal State ──
  let showImportModal = $state(false);
  let importProgramId = $state('');
  let importLoading = $state(false);
  let importError = $state('');
  let importSuccess = $state('');
  let importWarnings = $state<string[]>([]);
  let importPreview = $state<any[]>([]);
  let importSkipped = $state<string[]>([]);
  let fileInput: HTMLInputElement;

  // Load beneficiaries and programs on mount
  onMount(async () => {
    [beneficiaries, programs] = await Promise.all([
      apiFetch('/beneficiaries'),
      apiFetch('/programs'),
    ]);
    loading = false;
  });

  // Re-fetch the beneficiary list after any mutation
  async function reloadBeneficiaries() {
    beneficiaries = await apiFetch('/beneficiaries');
  }

  // ── MANUAL ENCODE ──────────────────────────────────────────────────────
  async function submitManual() {
    if (!manualForm.program_id || !manualForm.full_name || !manualForm.address || !manualForm.contact) {
      manualError = 'Please fill in all required fields (*)';
      return;
    }

    manualLoading = true;
    manualError = '';
    manualSuccess = '';
    manualWarning = '';

    try {
      const res = await apiFetch('/beneficiaries/manual', {
        method: 'POST',
        body: {
          program_id: manualForm.program_id,
          full_name: manualForm.full_name,
          address: manualForm.address,
          age: parseInt(manualForm.age) || 0,
          contact: manualForm.contact,
          barangay: manualForm.barangay,
          notes: manualForm.notes,
        },
      });

      manualSuccess = res.message;
      if (res.warning) manualWarning = res.warning;

      // Reset form fields but keep the selected program
      manualForm = {
        full_name: '', address: '', age: '', contact: '',
        barangay: '', notes: '', program_id: manualForm.program_id,
      };

      await reloadBeneficiaries();
    } catch (e) {
      manualError = e instanceof Error ? e.message : 'An error occurred';
    } finally {
      manualLoading = false;
    }
  }

  // ── EXCEL IMPORT ───────────────────────────────────────────────────────

  // Parse uploaded Excel/CSV file and build a preview array
  function handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    importError = '';
    importPreview = [];

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rows.length === 0) {
          importError = 'The uploaded file contains no data.';
          return;
        }

        // Map columns flexibly — supports various common header names
        importPreview = rows
          .map(row => ({
            full_name: row['Full Name'] || row['full_name'] || row['Name'] || row['name'] || '',
            address:   row['Address']   || row['address']   || '',
            age:       row['Age']       || row['age']       || '',
            contact:   row['Contact']   || row['contact']   || row['Contact Number'] || '',
            barangay:  row['Barangay']  || row['barangay']  || '',
          }))
          .filter(r => r.full_name); // Skip rows with no name

        if (importPreview.length === 0) {
          importError = 'No valid records found. Make sure the file has columns: "Full Name", "Address", "Contact".';
        }
      } catch {
        importError = 'Could not read the file. Please make sure it is a valid .xlsx or .xls file.';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Send the parsed preview data to the backend for bulk import
  async function submitImport() {
    if (!importProgramId) { importError = 'Please select a program'; return; }
    if (importPreview.length === 0) { importError = 'No data to import'; return; }

    importLoading = true;
    importError = '';
    importSuccess = '';
    importWarnings = [];
    importSkipped = [];

    try {
      const res = await apiFetch('/beneficiaries/bulk-import', {
        method: 'POST',
        body: { program_id: importProgramId, beneficiaries: importPreview },
      });

      importSuccess = res.message;
      importWarnings = res.warnings || [];
      importSkipped = res.skippedNames || [];
      importPreview = [];
      if (fileInput) fileInput.value = '';

      await reloadBeneficiaries();
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Import failed';
    } finally {
      importLoading = false;
    }
  }

  // Generate and download a blank Excel template for bulk import
  function downloadTemplate() {
    const template = [
      { 'Full Name': 'Juan Dela Cruz',  'Address': 'Blk 1 Lot 2, Sample St.', 'Age': 18, 'Contact': '09123456789', 'Barangay': 'Sto. Nino' },
      { 'Full Name': 'Maria Santos',    'Address': 'Blk 3 Lot 4, Sample St.', 'Age': 20, 'Contact': '09987654321', 'Barangay': 'Sto. Nino' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Beneficiaries');
    XLSX.writeFile(wb, 'SK_Beneficiary_Template.xlsx');
  }

  // Filter beneficiaries by program and search term
  let filtered = $derived(beneficiaries.filter(b => {
    const matchProgram = !filterProgram || b.program_id == filterProgram;
    const matchSearch  = !search || b.full_name.toLowerCase().includes(search.toLowerCase());
    return matchProgram && matchSearch;
  }));

  // Group filtered beneficiaries by program title for display
  let grouped = $derived(
    filtered.reduce<Record<string, { category: string; items: Beneficiary[] }>>((acc, b) => {
      const key = b.program_title || 'Unknown';
      if (!acc[key]) acc[key] = { category: b.category, items: [] };
      acc[key].items.push(b);
      return acc;
    }, {})
  );
</script>

<div class="p-6 space-y-5">

  <!-- Page Header -->
  <div class="flex items-start justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Beneficiaries</h1>
      <p class="text-gray-500 text-sm">Complete list of all approved benefit recipients</p>
    </div>
    <div class="flex gap-2">
      <button
        class="btn-ghost flex items-center gap-1.5"
        onclick={() => { showImportModal = true; showManualForm = false; }}
      >
        <FileSpreadsheet size={15} /> Import Excel
      </button>
      <button
        class="btn-primary flex items-center gap-1.5"
        onclick={() => { showManualForm = true; showImportModal = false; }}
      >
        <PenLine size={15} /> Manual Encode
      </button>
    </div>
  </div>

  <!-- ── MANUAL ENCODE FORM ───────────────────────────────────────────── -->
  {#if showManualForm}
    <div class="card border-2 border-blue-200 bg-blue-50/30">

      <!-- Form Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-900 flex items-center gap-2">
          <PenLine size={16} class="text-[#0A1F44]" /> Manual Beneficiary Entry
        </h2>
        <button
          onclick={() => { showManualForm = false; manualError = ''; manualSuccess = ''; manualWarning = ''; }}
          class="text-gray-400 hover:text-gray-600 transition"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Status Messages -->
      {#if manualSuccess}
        <div class="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm mb-3 flex items-start gap-2">
          <UserCheck size={15} class="shrink-0 mt-0.5" /> {manualSuccess}
        </div>
      {/if}
      {#if manualWarning}
        <div class="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-4 py-3 text-sm mb-3 flex items-start gap-2">
          <AlertTriangle size={15} class="shrink-0 mt-0.5" /> {manualWarning}
        </div>
      {/if}
      {#if manualError}
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-3 flex items-start gap-2">
          <X size={15} class="shrink-0 mt-0.5" /> {manualError}
        </div>
      {/if}

      <!-- Form Fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="label" for="mp">Program *</label>
          <select id="mp" bind:value={manualForm.program_id} class="input">
            <option value="">— Select a Program —</option>
            {#each programs as p}
              <option value={p.id}>{p.title}</option>
            {/each}
          </select>
        </div>
        <div>
          <label class="label" for="mfn">Full Name *</label>
          <input id="mfn" bind:value={manualForm.full_name} class="input" placeholder="Juan Dela Cruz" />
        </div>
        <div>
          <label class="label" for="mcontact">Contact Number *</label>
          <input id="mcontact" bind:value={manualForm.contact} class="input" placeholder="09XXXXXXXXX" />
        </div>
        <div>
          <label class="label" for="mage">Age</label>
          <input id="mage" bind:value={manualForm.age} type="number" class="input" placeholder="18" min="1" max="30" />
        </div>
        <div>
          <label class="label" for="mbrgy">Barangay</label>
          <input id="mbrgy" bind:value={manualForm.barangay} class="input" placeholder="Barangay name" />
        </div>
        <div class="md:col-span-2">
          <label class="label" for="maddr">Address *</label>
          <input id="maddr" bind:value={manualForm.address} class="input" placeholder="Block/Lot, Street, Barangay, City" />
        </div>
        <div class="md:col-span-2">
          <label class="label" for="mnotes">Notes (optional)</label>
          <input id="mnotes" bind:value={manualForm.notes} class="input" placeholder="Any additional information..." />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-3 mt-4">
        <button
          class="btn-primary flex-1 flex items-center justify-center gap-2"
          onclick={submitManual}
          disabled={manualLoading}
        >
          <UserCheck size={15} />
          {manualLoading ? 'Saving...' : 'Save Beneficiary'}
        </button>
        <button
          class="btn-ghost"
          onclick={() => { showManualForm = false; manualError = ''; manualSuccess = ''; }}
        >
          Close
        </button>
      </div>

    </div>
  {/if}

  <!-- ── EXCEL IMPORT PANEL ────────────────────────────────────────────── -->
  {#if showImportModal}
    <div class="card border-2 border-green-200 bg-green-50/30">

      <!-- Panel Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-900 flex items-center gap-2">
          <FileSpreadsheet size={16} class="text-green-600" /> Import from Excel
        </h2>
        <button
          onclick={() => { showImportModal = false; importPreview = []; importError = ''; importSuccess = ''; }}
          class="text-gray-400 hover:text-gray-600 transition"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Status Messages -->
      {#if importSuccess}
        <div class="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm mb-3">
          <div class="flex items-center gap-2"><UserCheck size={15} /> {importSuccess}</div>
          {#if importSkipped.length > 0}
            <div class="mt-1 text-orange-700 flex items-center gap-1.5">
              <AlertTriangle size={13} /> Skipped (duplicates): {importSkipped.join(', ')}
            </div>
          {/if}
        </div>
      {/if}
      {#if importWarnings.length > 0}
        <div class="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-4 py-3 text-sm mb-3">
          <strong class="flex items-center gap-1.5"><AlertTriangle size={14} /> The following have prior benefit history:</strong>
          <ul class="mt-1 space-y-0.5">
            {#each importWarnings as w}
              <li>• {w}</li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if importError}
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-3 flex items-center gap-2">
          <X size={14} /> {importError}
        </div>
      {/if}

      <div class="space-y-4">

        <!-- Step 1: Download Template -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-sm text-gray-800">Step 1 — Download the Excel Template</p>
              <p class="text-xs text-gray-500 mt-0.5">Use this to ensure your file follows the correct format</p>
            </div>
            <button
              class="btn-ghost text-green-700 flex items-center gap-1.5"
              onclick={downloadTemplate}
            >
              <Download size={14} /> Download Template
            </button>
          </div>
        </div>

        <!-- Step 2: Select Program -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="font-medium text-sm text-gray-800 mb-2">Step 2 — Select a Program *</p>
          <select bind:value={importProgramId} class="input">
            <option value="">— Select a Program —</option>
            {#each programs as p}
              <option value={p.id}>{p.title}</option>
            {/each}
          </select>
        </div>

        <!-- Step 3: Upload File -->
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <p class="font-medium text-sm text-gray-800 mb-2">Step 3 — Upload Your Excel File *</p>
          <input
            bind:this={fileInput}
            type="file"
            accept=".xlsx,.xls,.csv"
            onchange={handleFileUpload}
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-[#0A1F44] hover:file:bg-blue-100"
          />
          <p class="text-xs text-gray-400 mt-1">Accepted formats: .xlsx, .xls, .csv</p>
        </div>

        <!-- Preview Table -->
        {#if importPreview.length > 0}
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <p class="font-medium text-sm text-gray-800 mb-3">
              Preview — {importPreview.length} records ready to import
            </p>
            <div class="overflow-x-auto max-h-48 overflow-y-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-50 sticky top-0">
                  <tr class="text-left text-gray-500">
                    <th class="px-3 py-2 font-medium">#</th>
                    <th class="px-3 py-2 font-medium">Full Name</th>
                    <th class="px-3 py-2 font-medium">Address</th>
                    <th class="px-3 py-2 font-medium">Contact</th>
                    <th class="px-3 py-2 font-medium">Age</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  {#each importPreview as row, i}
                    <tr class="hover:bg-gray-50">
                      <td class="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td class="px-3 py-1.5 font-medium">{row.full_name}</td>
                      <td class="px-3 py-1.5 text-gray-600">{row.address}</td>
                      <td class="px-3 py-1.5">{row.contact}</td>
                      <td class="px-3 py-1.5">{row.age || '—'}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Import Submit -->
          <button
            class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            onclick={submitImport}
            disabled={importLoading}
          >
            <Upload size={15} />
            {importLoading ? 'Importing...' : `Import ${importPreview.length} Beneficiaries`}
          </button>
        {/if}

      </div>
    </div>
  {/if}

  <!-- Filters -->
  <div class="card flex flex-wrap gap-3">
    <div class="flex-1 min-w-48">
      <label class="label flex items-center gap-1.5" for="fp">
        <SlidersHorizontal size={13} class="text-gray-400" /> Filter by Program
      </label>
      <select id="fp" bind:value={filterProgram} class="input">
        <option value="">All Programs</option>
        {#each programs as p}
          <option value={p.id}>{p.title}</option>
        {/each}
      </select>
    </div>
    <div class="flex-1 min-w-48">
      <label class="label flex items-center gap-1.5" for="fs">
        <Search size={13} class="text-gray-400" /> Search
      </label>
      <input id="fs" bind:value={search} class="input" placeholder="Search by name..." />
    </div>
  </div>

  <!-- Beneficiary List -->
  {#if loading}
    <div class="text-gray-400 text-sm">Loading beneficiaries...</div>
  {:else}
    <div class="text-sm text-gray-500 font-medium">{filtered.length} beneficiar{filtered.length === 1 ? 'y' : 'ies'} total</div>

    {#each Object.entries(grouped) as [programTitle, group]}
      <div class="card">

        <!-- Program Group Header -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-lg bg-[#0A1F44]/10 flex items-center justify-center text-[#0A1F44] text-sm font-bold">
            {group.items.length}
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{programTitle}</h3>
            <span class="text-xs text-gray-500">{group.category}</span>
          </div>
        </div>

        <!-- Beneficiary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {#each group.items as b}
            <div class="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
              <!-- Avatar with first letter -->
              <div class="w-8 h-8 rounded-full bg-[#0A1F44] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {b.full_name.charAt(0)}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">{b.full_name}</div>
                <div class="text-xs text-gray-400 truncate">{b.address}</div>
              </div>
            </div>
          {/each}
        </div>

      </div>
    {/each}

    {#if Object.keys(grouped).length === 0}
      <div class="card text-center text-gray-400 py-12 flex flex-col items-center gap-2">
        <Users size={32} class="text-gray-300" />
        No beneficiaries found
      </div>
    {/if}
  {/if}

</div>