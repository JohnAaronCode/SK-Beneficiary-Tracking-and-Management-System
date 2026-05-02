<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { apiFetch, user } from '$lib/api.js';
  import {
    ClipboardList, Users, Send, ArrowLeft,
    CheckCircle2, AlertCircle, Loader2
  } from 'lucide-svelte';

  interface Program {
    title: string;
    category: string;
    slots: number;
    slots_used: number;
  }

  let program = $state<Program | null>(null);
  let loading = $state(true);
  let submitting = $state(false);
  let error = $state('');
  let success = $state(false);

  let form = $state({
    full_name: '',
    address: '',
    age: '',
    contact: '',
    barangay: '',
    requirements_submitted: ''
  });

  onMount(async () => {
    if (!$user) { goto('/login'); return; }
    try {
      program = await apiFetch(`/programs/${page.params.id}`);
      form.full_name = $user?.full_name ?? '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      loading = false;
    }
  });

  async function submitApplication() {
    submitting = true;
    error = '';
    try {
      await apiFetch('/applications', {
        method: 'POST',
        body: {
          program_id: page.params.id,
          full_name: form.full_name,
          address: form.address,
          age: parseInt(form.age),
          contact: form.contact,
          barangay: form.barangay,
          requirements_submitted: form.requirements_submitted
        }
      });
      success = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="max-w-lg mx-auto">
  {#if loading}
    <div class="flex items-center justify-center gap-2 text-slate-400 text-sm py-16">
      <div class="w-5 h-5 border-2 border-slate-200 rounded-full animate-spin"
        style="border-top-color: #0A1F44;"></div>
      Loading...
    </div>

  {:else if success}
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm text-center py-14 px-8">
      <div class="flex justify-center mb-4">
        <div class="bg-emerald-100 rounded-full p-4">
          <CheckCircle2 class="w-10 h-10 text-emerald-600" />
        </div>
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Na-submit na ang Application!</h2>
      <p class="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
        Hihintayin ang review ng SK Officials. Malalaman mo ang status sa "Aking Applications".
      </p>
      <div class="flex gap-3 justify-center">
        <a href="/my-applications"
          class="text-sm font-medium px-5 py-2.5 rounded-lg transition text-white"
          style="background: #0A1F44;"
          onmouseenter={e => (e.currentTarget as HTMLElement).style.background = '#0d2756'}
          onmouseleave={e => (e.currentTarget as HTMLElement).style.background = '#0A1F44'}>
          Tingnan ang Applications
        </a>
        <a href="/"
          class="border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-sm px-5 py-2.5 rounded-lg transition">
          Bumalik sa Home
        </a>
      </div>
    </div>

  {:else}
    <!-- Program Info Banner -->
    {#if program}
      <div class="rounded-xl p-4 mb-5 border"
        style="background: rgba(10,31,68,0.05); border-color: rgba(10,31,68,0.15);">
        <div class="flex items-start gap-3">
          <div class="rounded-lg p-2 shrink-0"
            style="background: rgba(10,31,68,0.10); color: #0A1F44;">
            <ClipboardList class="w-5 h-5" />
          </div>
          <div>
            <h2 class="font-bold" style="color: #0A1F44;">{program.title}</h2>
            <p class="text-sm" style="color: rgba(10,31,68,0.70);">{program.category}</p>
            <p class="text-xs mt-1 flex items-center gap-1" style="color: rgba(10,31,68,0.55);">
              <Users class="w-3.5 h-3.5" />
              {program.slots - program.slots_used} slots natitira sa {program.slots} total
            </p>
          </div>
        </div>
      </div>
    {/if}

    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h1 class="text-lg font-bold text-slate-900 mb-1">Application Form</h1>
      <p class="text-slate-500 text-sm mb-5">Punan ang lahat ng fields ng tama at kumpleto.</p>

      <form onsubmit={(e) => { e.preventDefault(); submitApplication(); }} class="space-y-4">
        <div>
          <label class="label" for="fn">Buong Pangalan *</label>
          <input id="fn" bind:value={form.full_name} class="input" required placeholder="Juan Dela Cruz" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="age">Edad *</label>
            <input id="age" bind:value={form.age} type="number" class="input"
              required placeholder="18" min="1" max="30" />
          </div>
          <div>
            <label class="label" for="contact">Contact Number *</label>
            <input id="contact" bind:value={form.contact} class="input"
              required placeholder="09XXXXXXXXX" />
          </div>
        </div>

        <div>
          <label class="label" for="barangay">Barangay *</label>
          <input id="barangay" bind:value={form.barangay} class="input"
            required placeholder="Barangay mo" />
        </div>

        <div>
          <label class="label" for="address">Kumpletong Address *</label>
          <input id="address" bind:value={form.address} class="input"
            required placeholder="Blk/Lot, Street, Barangay, Lungsod" />
        </div>

        <div>
          <label class="label" for="req">Mga Sinubmit na Requirements</label>
          <textarea id="req" bind:value={form.requirements_submitted} class="input h-20 resize-none"
            placeholder="e.g. Photocopy ng report card, Barangay certificate..."></textarea>
        </div>

        {#if error}
          <div class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
            <AlertCircle class="w-4 h-4 shrink-0" />
            {error}
          </div>
        {/if}

        <div class="flex gap-3 pt-1">
          <button type="submit"
            class="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg transition text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style="background: #0A1F44;"
            onmouseenter={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) (e.currentTarget as HTMLElement).style.background = '#0d2756'; }}
            onmouseleave={e => (e.currentTarget as HTMLElement).style.background = '#0A1F44'}
            disabled={submitting}>
            {#if submitting}
              <Loader2 class="w-4 h-4 animate-spin" />
              Isinusumite...
            {:else}
              <Send class="w-4 h-4" />
              I-submit ang Application
            {/if}
          </button>
          <a href="/"
            class="flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm px-4 py-2.5 rounded-lg transition">
            <ArrowLeft class="w-4 h-4" />
            Bumalik
          </a>
        </div>
      </form>
    </div>
  {/if}
</div>