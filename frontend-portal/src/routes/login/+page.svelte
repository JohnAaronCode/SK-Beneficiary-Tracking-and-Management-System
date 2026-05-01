<script>
  import { goto } from '$app/navigation';
  import { login, apiFetch } from '$lib/api.js';

  let username = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleLogin() {
    error = '';
    loading = true;
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      login(res.user, res.token);
      goto('/');
    } catch (e) {
      error = e instanceof Error ? e.message : 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-sm mx-auto mt-10">
  <div class="card">
    <div class="text-center mb-6">
      <div class="text-4xl mb-2">👤</div>
      <h1 class="text-xl font-bold text-gray-900">Login sa Portal</h1>
      <p class="text-gray-500 text-sm">I-login ang iyong account para mag-apply</p>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
      <div>
        <label class="label" for="username">Username</label>
        <input id="username" bind:value={username} class="input" placeholder="Ilagay ang username" required />
      </div>
      <div>
        <label class="label" for="password">Password</label>
        <input id="password" bind:value={password} type="password" class="input" placeholder="Ilagay ang password" required />
      </div>
      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>
      {/if}
      <button type="submit" class="btn-primary w-full py-2.5" disabled={loading}>
        {loading ? 'Signing in...' : 'Login'}
      </button>
    </form>

    <p class="text-center text-sm text-gray-500 mt-4">
      Wala pang account?
      <a href="/register" class="text-blue-600 hover:underline font-medium">Mag-register dito</a>
    </p>
  </div>
</div>