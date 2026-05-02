<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api.js';
  import Plus from 'lucide-svelte/icons/plus';
  import Tag from 'lucide-svelte/icons/tag';
  import ShieldCheck from 'lucide-svelte/icons/shield-check';
  import UserPlus from 'lucide-svelte/icons/user-plus';
  import X from 'lucide-svelte/icons/x';
  import Eye from 'lucide-svelte/icons/eye';
  import EyeOff from 'lucide-svelte/icons/eye-off';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Save from 'lucide-svelte/icons/save';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import Phone from 'lucide-svelte/icons/phone';
  import User from 'lucide-svelte/icons/user';
  import Building2 from 'lucide-svelte/icons/building-2';

  interface Category { name: string; }
  interface UserRow  { id: number; full_name: string; username: string; role: string; }
  interface UserForm { full_name: string; username: string; password: string; role: 'admin' | 'staff'; }
  interface BarangayInfo { barangay_name: string; sk_chairperson: string; contact: string; address: string; municipality: string; }

  // ── State ──────────────────────────────────────────────────
  let categories    = $state<Category[]>([]);
  let users         = $state<UserRow[]>([]);
  let barangayInfo  = $state<BarangayInfo>({ barangay_name: '', sk_chairperson: '', contact: '', address: '', municipality: '' });
  let newCat        = $state('');
  let error         = $state('');
  let success       = $state('');

  // Add User modal
  let showAddUser      = $state(false);
  let showPassword     = $state(false);
  let userForm         = $state<UserForm>({ full_name: '', username: '', password: '', role: 'staff' });
  let userFormError    = $state('');
  let userFormLoading  = $state(false);

  // Edit User modal
  let showEditUser     = $state(false);
  let editingUser      = $state<UserRow | null>(null);
  let editForm         = $state({ full_name: '', role: 'staff' as 'admin' | 'staff', password: '' });
  let editShowPassword = $state(false);
  let editFormError    = $state('');
  let editFormLoading  = $state(false);

  // Barangay info edit
  let editingBarangay = $state(false);
  let barangayLoading = $state(false);

  // ── Load data ─────────────────────────────────────────────
  onMount(async () => {
    [categories, users] = await Promise.all([apiFetch('/categories'), apiFetch('/users')]);
    try { barangayInfo = await apiFetch('/barangay-info'); } catch {}
  });

  function flash(msg: string, type: 'success' | 'error' = 'success') {
    if (type === 'success') { success = msg; error = ''; }
    else { error = msg; success = ''; }
    setTimeout(() => { success = ''; error = ''; }, 3000);
  }

  // ── Categories ────────────────────────────────────────────
  async function addCategory() {
    if (!newCat.trim()) return;
    try {
      await apiFetch('/categories', { method: 'POST', body: { name: newCat.trim() } });
      categories = await apiFetch('/categories');
      newCat = '';
      flash('Category added!');
    } catch (e) { flash(e instanceof Error ? e.message : 'Error', 'error'); }
  }

  async function deleteCategory(name: string) {
    if (!confirm(`Delete category "${name}"? Programs using this category will not be affected.`)) return;
    try {
      await apiFetch(`/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
      categories = await apiFetch('/categories');
      flash('Category deleted.');
    } catch (e) { flash(e instanceof Error ? e.message : 'Error', 'error'); }
  }

  // ── Add User ──────────────────────────────────────────────
  function openAddUser() {
    userForm = { full_name: '', username: '', password: '', role: 'staff' };
    userFormError = ''; showPassword = false; showAddUser = true;
  }

  async function addUser() {
    userFormError = '';
    if (!userForm.full_name || !userForm.username || !userForm.password) { userFormError = 'All fields are required.'; return; }
    if (userForm.password.length < 6) { userFormError = 'Password must be at least 6 characters.'; return; }
    userFormLoading = true;
    try {
      await apiFetch('/users', { method: 'POST', body: userForm });
      users = await apiFetch('/users');
      showAddUser = false;
      flash('User account created!');
    } catch (e) { userFormError = e instanceof Error ? e.message : 'Error creating user'; }
    finally { userFormLoading = false; }
  }

  // ── Edit User ─────────────────────────────────────────────
  function openEditUser(u: UserRow) {
    editingUser = u;
    editForm = { full_name: u.full_name, role: u.role as 'admin' | 'staff', password: '' };
    editFormError = ''; editShowPassword = false; showEditUser = true;
  }

  async function saveEditUser() {
    if (!editingUser) return;
    editFormError = '';
    if (!editForm.full_name) { editFormError = 'Full name is required.'; return; }
    if (editForm.password && editForm.password.length < 6) { editFormError = 'Password must be at least 6 characters.'; return; }
    editFormLoading = true;
    try {
      await apiFetch(`/users/${editingUser.id}`, { method: 'PUT', body: editForm });
      users = await apiFetch('/users');
      showEditUser = false;
      flash('User updated successfully!');
    } catch (e) { editFormError = e instanceof Error ? e.message : 'Error updating user'; }
    finally { editFormLoading = false; }
  }

  // ── Delete User ───────────────────────────────────────────
  async function deleteUser(u: UserRow) {
    if (!confirm(`Delete account of "${u.full_name}" (@${u.username})?`)) return;
    try {
      await apiFetch(`/users/${u.id}`, { method: 'DELETE' });
      users = await apiFetch('/users');
      flash('User deleted.');
    } catch (e) { flash(e instanceof Error ? e.message : 'Error deleting user', 'error'); }
  }

  // ── Barangay Info ─────────────────────────────────────────
  async function saveBarangayInfo() {
    barangayLoading = true;
    try {
      await apiFetch('/barangay-info', { method: 'PUT', body: barangayInfo });
      editingBarangay = false;
      flash('Barangay information saved!');
    } catch (e) { flash(e instanceof Error ? e.message : 'Error saving', 'error'); }
    finally { barangayLoading = false; }
  }

  const roleColors: Record<string, string> = {
    admin:     'bg-purple-100 text-purple-700',
    staff:     'bg-blue-100 text-blue-700',
    applicant: 'bg-gray-100 text-gray-600',
  };
</script>

<div class="p-6 space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
    <p class="text-gray-500 text-sm">System configuration and account management</p>
  </div>

  <!-- Flash Messages -->
  {#if error}  <div class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{error}</div>   {/if}
  {#if success}<div class="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-sm">{success}</div>{/if}

  <!-- ── ADD USER MODAL ─────────────────────────────────────── -->
  {#if showAddUser}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(10,31,68,0.5);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Add New User</h2>
            <p class="text-sm text-gray-500">Create an account for an SK officer</p>
          </div>
          <button onclick={() => showAddUser = false} class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><X size={18} /></button>
        </div>
        {#if userFormError}<div class="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{userFormError}</div>{/if}
        <div class="space-y-3">
          <div>
            <label class="label" for="add_fn">Full Name *</label>
            <input id="add_fn" bind:value={userForm.full_name} class="input" placeholder="e.g. Juan Dela Cruz" />
          </div>
          <div>
            <label class="label" for="add_un">Username *</label>
            <input id="add_un" bind:value={userForm.username} class="input" placeholder="e.g. jdelacruz" />
          </div>
          <div>
            <label class="label" for="add_pw">Password *</label>
            <div class="relative">
              <input id="add_pw" type={showPassword ? 'text' : 'password'} bind:value={userForm.password} class="input pr-10" placeholder="Min. 6 characters" />
              <button type="button" onclick={() => showPassword = !showPassword} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {#if showPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
              </button>
            </div>
          </div>
          <div>
            <label class="label" for="add_role">Role *</label>
            <select id="add_role" bind:value={userForm.role} class="input">
              <option value="staff">Staff — can view and process applications</option>
              <option value="admin">Admin — full access including settings</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 mt-5">
          <button onclick={addUser} disabled={userFormLoading} class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90" style="background:#0A1F44;">
            <UserPlus size={15} /> {userFormLoading ? 'Creating...' : 'Create Account'}
          </button>
          <button onclick={() => showAddUser = false} class="btn-ghost flex-1">Cancel</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ── EDIT USER MODAL ────────────────────────────────────── -->
  {#if showEditUser && editingUser}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(10,31,68,0.5);">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Edit User</h2>
            <p class="text-sm text-gray-500">@{editingUser.username}</p>
          </div>
          <button onclick={() => showEditUser = false} class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><X size={18} /></button>
        </div>
        {#if editFormError}<div class="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{editFormError}</div>{/if}
        <div class="space-y-3">
          <div>
            <label class="label" for="edit_fn">Full Name *</label>
            <input id="edit_fn" bind:value={editForm.full_name} class="input" />
          </div>
          <div>
            <label class="label" for="edit_role">Role *</label>
            <select id="edit_role" bind:value={editForm.role} class="input">
              <option value="staff">Staff — can view and process applications</option>
              <option value="admin">Admin — full access including settings</option>
            </select>
          </div>
          <div>
            <label class="label" for="edit_pw">New Password <span class="text-gray-400 font-normal">(leave blank to keep current)</span></label>
            <div class="relative">
              <input id="edit_pw" type={editShowPassword ? 'text' : 'password'} bind:value={editForm.password} class="input pr-10" placeholder="Min. 6 characters" />
              <button type="button" onclick={() => editShowPassword = !editShowPassword} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {#if editShowPassword}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-5">
          <button onclick={saveEditUser} disabled={editFormLoading} class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90" style="background:#0A1F44;">
            <Save size={15} /> {editFormLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onclick={() => showEditUser = false} class="btn-ghost flex-1">Cancel</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ── BARANGAY INFORMATION ───────────────────────────────── -->
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-semibold text-gray-800 flex items-center gap-2">
        <Building2 size={16} style="color:#0A1F44;" /> Barangay Information
      </h2>
      {#if !editingBarangay}
        <button
          onclick={() => editingBarangay = true}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0A1F44] border border-[#0A1F44]/20 hover:bg-[#0A1F44]/5 transition"
        >
          <Pencil size={13} /> Edit
        </button>
      {/if}
    </div>

    {#if editingBarangay}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="label" for="bi_brgy">Barangay Name *</label>
          <input id="bi_brgy" bind:value={barangayInfo.barangay_name} class="input" placeholder="e.g. Barangay Sto. Niño" />
        </div>
        <div>
          <label class="label" for="bi_mun">Municipality / City</label>
          <input id="bi_mun" bind:value={barangayInfo.municipality} class="input" placeholder="e.g. Olongapo City" />
        </div>
        <div>
          <label class="label" for="bi_chair">SK Chairperson</label>
          <input id="bi_chair" bind:value={barangayInfo.sk_chairperson} class="input" placeholder="e.g. Juan Dela Cruz" />
        </div>
        <div>
          <label class="label" for="bi_contact">Contact Number</label>
          <input id="bi_contact" bind:value={barangayInfo.contact} class="input" placeholder="09XXXXXXXXX" />
        </div>
        <div class="md:col-span-2">
          <label class="label" for="bi_addr">Full Address</label>
          <input id="bi_addr" bind:value={barangayInfo.address} class="input" placeholder="e.g. Zone 1, Barangay Sto. Niño, Olongapo City" />
        </div>
      </div>
      <div class="flex gap-2 mt-4">
        <button onclick={saveBarangayInfo} disabled={barangayLoading}
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90" style="background:#0A1F44;">
          <Save size={15} /> {barangayLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button onclick={() => editingBarangay = false} class="btn-ghost">Cancel</button>
      </div>
    {:else}
      <!-- Display Mode -->
      {#if !barangayInfo.barangay_name}
        <div class="text-center py-6 text-gray-400">
          <Building2 size={28} class="mx-auto mb-2 text-gray-300" />
          <p class="text-sm">No barangay information set yet.</p>
          <button onclick={() => editingBarangay = true} class="text-xs mt-1 underline" style="color:#0A1F44;">Add now</button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3">
            <Building2 size={16} class="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div class="text-xs text-gray-400">Barangay</div>
              <div class="text-sm font-medium">{barangayInfo.barangay_name}</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <MapPin size={16} class="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div class="text-xs text-gray-400">Municipality / City</div>
              <div class="text-sm font-medium">{barangayInfo.municipality || '—'}</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <User size={16} class="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div class="text-xs text-gray-400">SK Chairperson</div>
              <div class="text-sm font-medium">{barangayInfo.sk_chairperson || '—'}</div>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <Phone size={16} class="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div class="text-xs text-gray-400">Contact Number</div>
              <div class="text-sm font-medium">{barangayInfo.contact || '—'}</div>
            </div>
          </div>
          {#if barangayInfo.address}
            <div class="md:col-span-2 flex items-start gap-3">
              <MapPin size={16} class="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <div class="text-xs text-gray-400">Address</div>
                <div class="text-sm font-medium">{barangayInfo.address}</div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>

  <!-- ── CATEGORIES & ACCOUNTS GRID ────────────────────────── -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

    <!-- Program Categories -->
    <div class="card">
      <h2 class="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Tag size={16} style="color:#0A1F44;" /> Program Categories
      </h2>
      <p class="text-xs text-gray-400 mb-4">These categories appear in the program creation form.</p>
      <div class="flex gap-2 mb-4">
        <input bind:value={newCat} class="input flex-1" placeholder="New category name..."
          onkeydown={(e) => e.key === 'Enter' && addCategory()} />
        <button onclick={addCategory}
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90" style="background:#0A1F44;">
          <Plus size={15} /> Add
        </button>
      </div>
      <div class="space-y-1.5">
        {#each categories as cat}
          <div class="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 group hover:bg-[#0A1F44]/5 transition">
            <span class="w-2 h-2 rounded-full shrink-0" style="background:#0A1F44;"></span>
            <span class="text-sm flex-1">{cat.name}</span>
            <button
              onclick={() => deleteCategory(cat.name)}
              class="opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-red-100 text-red-500"
              title="Delete category"
            >
              <Trash2 size={13} />
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- System Accounts -->
    <div class="card">
      <div class="flex items-center justify-between mb-1">
        <h2 class="font-semibold text-gray-800 flex items-center gap-2">
          <ShieldCheck size={16} style="color:#0A1F44;" /> System Accounts
        </h2>
        <button onclick={openAddUser}
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition hover:opacity-90" style="background:#0A1F44;">
          <UserPlus size={13} /> Add User
        </button>
      </div>
      <p class="text-xs text-gray-400 mb-4">SK officers who can access this admin dashboard.</p>
      <div class="space-y-2">
        {#each users as u}
          <div class="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 group hover:bg-[#0A1F44]/5 transition">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style="background:#0A1F44;">
              {u.full_name?.charAt(0)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{u.full_name}</div>
              <div class="text-xs text-gray-400">@{u.username}</div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium {roleColors[u.role] ?? 'bg-gray-100 text-gray-600'}">
              {u.role}
            </span>
            <!-- Action buttons — visible on hover -->
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
              <button onclick={() => openEditUser(u)}
                class="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition" title="Edit user">
                <Pencil size={13} />
              </button>
              {#if u.role !== 'applicant'}
                <button onclick={() => deleteUser(u)}
                  class="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition" title="Delete user">
                  <Trash2 size={13} />
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

</div>