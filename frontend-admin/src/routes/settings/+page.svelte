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

  interface Category { name: string; }
  interface User { id: number; full_name: string; username: string; role: string; }

  interface UserForm {
    full_name: string;
    username: string;
    password: string;
    role: 'admin' | 'staff';
  }

  let categories = $state<Category[]>([]);
  let users = $state<User[]>([]);
  let newCat = $state('');
  let error = $state('');
  let success = $state('');
  let showAddUser = $state(false);
  let showPassword = $state(false);
  let userForm = $state<UserForm>({ full_name: '', username: '', password: '', role: 'staff' });
  let userFormError = $state('');
  let userFormLoading = $state(false);

  onMount(async () => {
    [categories, users] = await Promise.all([apiFetch('/categories'), apiFetch('/users')]);
  });

  async function addCategory() {
    if (!newCat.trim()) return;
    try {
      await apiFetch('/categories', { method: 'POST', body: { name: newCat.trim() } });
      categories = await apiFetch('/categories');
      newCat = '';
      success = 'Category added!';
      setTimeout(() => success = '', 3000);
    } catch (e) { error = e instanceof Error ? e.message : 'Error'; }
  }

  async function addUser() {
    userFormError = '';
    if (!userForm.full_name || !userForm.username || !userForm.password) {
      userFormError = 'All fields are required.'; return;
    }
    if (userForm.password.length < 6) {
      userFormError = 'Password must be at least 6 characters.'; return;
    }
    userFormLoading = true;
    try {
      await apiFetch('/users', { method: 'POST', body: userForm });
      users = await apiFetch('/users');
      showAddUser = false;
      userForm = { full_name: '', username: '', password: '', role: 'staff' };
      success = 'User account created!';
      setTimeout(() => success = '', 3000);
    } catch (e) {
      userFormError = e instanceof Error ? e.message : 'Error creating user';
    } finally {
      userFormLoading = false;
    }
  }

  function openAddUser() {
    userForm = { full_name: '', username: '', password: '', role: 'staff' };
    userFormError = '';
    showPassword = false;
    showAddUser = true;
  }
</script>

<div class="p-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
    <p class="text-gray-500 text-sm">System configuration and management</p>
  </div>

  {#if error}<div class="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>{/if}
  {#if success}<div class="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>{/if}

  <!-- Add User Modal -->
  {#if showAddUser}
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-lg font-bold text-gray-900">Add New User</h2>
            <p class="text-sm text-gray-500">Create an account for an SK officer</p>
          </div>
          <button onclick={() => showAddUser = false}
            class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        {#if userFormError}
          <div class="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{userFormError}</div>
        {/if}

        <div class="space-y-3">
          <div>
            <label class="label" for="full_name">Full Name *</label>
            <input id="full_name" bind:value={userForm.full_name} class="input" placeholder="e.g. Juan Dela Cruz" />
          </div>
          <div>
            <label class="label" for="uname">Username *</label>
            <input id="uname" bind:value={userForm.username} class="input" placeholder="e.g. jdelacruz" />
          </div>
          <div>
            <label class="label" for="pass">Password *</label>
            <div class="relative">
              <input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                bind:value={userForm.password}
                class="input pr-10"
                placeholder="Min. 6 characters"
              />
              <button
                type="button"
                onclick={() => showPassword = !showPassword}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {#if showPassword}
                  <EyeOff size={16} />
                {:else}
                  <Eye size={16} />
                {/if}
              </button>
            </div>
          </div>
          <div>
            <label class="label" for="role">Role *</label>
            <select id="role" bind:value={userForm.role} class="input">
              <option value="staff">Staff — can view and process applications</option>
              <option value="admin">Admin — full access including settings</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2 mt-5">
          <button
            onclick={addUser}
            disabled={userFormLoading}
            class="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <UserPlus size={15} />
            {userFormLoading ? 'Creating...' : 'Create Account'}
          </button>
          <button onclick={() => showAddUser = false} class="btn-ghost flex-1">Cancel</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
    <!-- Categories -->
    <div class="card">
      <h2 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Tag size={16} class="text-blue-500" /> Program Categories
      </h2>
      <div class="flex gap-2 mb-4">
        <input bind:value={newCat} class="input flex-1" placeholder="New category name..."
          onkeydown={(e) => e.key === 'Enter' && addCategory()} />
        <button class="btn-primary flex items-center gap-1.5" onclick={addCategory}>
          <Plus size={15} /> Add
        </button>
      </div>
      <div class="space-y-1.5">
        {#each categories as cat}
          <div class="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
            <span class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            <span class="text-sm">{cat.name}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Users -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-800 flex items-center gap-2">
          <ShieldCheck size={16} class="text-blue-500" /> System Accounts
        </h2>
        <button onclick={openAddUser} class="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <UserPlus size={14} /> Add User
        </button>
      </div>
      <div class="space-y-2">
        {#each users as u}
          <div class="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {u.full_name?.charAt(0)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{u.full_name}</div>
              <div class="text-xs text-gray-400">@{u.username}</div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium
              {u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}">
              {u.role}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- System Info -->
  <div class="card bg-gray-50">
    <h2 class="font-semibold text-gray-700 mb-3">System Information</h2>
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div><span class="text-gray-500">Database:</span> <strong>MySQL</strong></div>
      <div><span class="text-gray-500">Backend:</span> <strong>Node.js + Express</strong></div>
      <div><span class="text-gray-500">Frontend:</span> <strong>SvelteKit 5 + Tailwind v4</strong></div>
      <div><span class="text-gray-500">Version:</span> <strong>1.0.0</strong></div>
    </div>
  </div>
</div>