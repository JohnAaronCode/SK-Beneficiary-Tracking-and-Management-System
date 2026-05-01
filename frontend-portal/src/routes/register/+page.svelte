<script>
  import { goto } from '$app/navigation';
  import { login, apiFetch } from '$lib/api.js';

  let form = $state({
    username: '', password: '', confirmPassword: '',
    full_name: '', contact: '', address: '', barangay: ''
  });
  let error = $state('');
  let loading = $state(false);

  async function handleRegister() {
    error = '';
    if (form.password !== form.confirmPassword) {
      error = 'Hindi magkatugma ang password!';
      return;
    }
    loading = true;
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          username: form.username,
          password: form.password,
          full_name: form.full_name,
          contact: form.contact,
          address: form.address,
          barangay: form.barangay
        }
      });
      login(res.user, res.token);
      goto('/');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Registration failed';
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-lg mx-auto mt-8">
  <div class="card">
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">📝</div>
      <h1 class="text-xl font-bold text-gray-900">Mag-register</h1>
      <p class="text-gray-500 text-sm">Gumawa ng account para makapag-apply sa mga SK programs</p>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-4">
      <div class="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
        📋 <strong>Personal Information</strong>
      </div>

      <div>
        <label class="label" for="fullname">Buong Pangalan *</label>
        <input id="fullname" bind:value={form.full_name} class="input" placeholder="e.g. Juan Dela Cruz" required />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="contact">Contact Number *</label>
          <input id="contact" bind:value={form.contact} class="input" placeholder="09XXXXXXXXX" required />
        </div>
        <div>
          <label class="label" for="barangay">Barangay *</label>
          <input id="barangay" bind:value={form.barangay} class="input" placeholder="Barangay mo" required />
        </div>
      </div>

      <div>
        <label class="label" for="address">Address *</label>
        <input id="address" bind:value={form.address} class="input" placeholder="Kumpletong address" required />
      </div>

      <div class="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 mt-4">
        🔐 <strong>Account Information</strong>
      </div>

      <div>
        <label class="label" for="username">Username *</label>
        <input id="username" bind:value={form.username} class="input" placeholder="Piliin ang username" required />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="pass">Password *</label>
          <input id="pass" bind:value={form.password} type="password" class="input" placeholder="Password" required />
        </div>
        <div>
          <label class="label" for="cpass">Ulitin ang Password *</label>
          <input id="cpass" bind:value={form.confirmPassword} type="password" class="input" placeholder="Ulitin" required />
        </div>
      </div>

      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
      {/if}

      <button type="submit" class="btn-primary w-full py-2.5 text-base" disabled={loading}>
        {loading ? 'Nagre-register...' : '✅ Mag-register'}
      </button>
    </form>

    <p class="text-center text-sm text-gray-500 mt-4">
      May account na?
      <a href="/login" class="text-blue-600 hover:underline font-medium">Login dito</a>
    </p>
  </div>
</div>