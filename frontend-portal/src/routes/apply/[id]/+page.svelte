<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { apiFetch, user } from '$lib/api.js';
	import {
		ClipboardList,
		Users,
		ArrowLeft,
		CheckCircle2,
		AlertCircle,
		Loader2
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
		if (!$user) {
			goto('/login');
			return;
		}
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

<div class="mx-auto max-w-lg">
	{#if loading}
		<div class="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200"
				style="border-top-color: #0A1F44;"
			></div>
			Loading...
		</div>
	{:else if success}
		<div class="rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
			<div class="mb-4 flex justify-center">
				<div class="rounded-full bg-emerald-100 p-4">
					<CheckCircle2 class="h-10 w-10 text-emerald-600" />
				</div>
			</div>
			<h2 class="mb-2 text-xl font-bold text-slate-900">Application Submitted!</h2>
			<p class="mx-auto mb-6 max-w-xs text-sm text-slate-500">
				Your application has been successfully submitted. You can check the status of your
				application in the "My Applications" section. Thank you for applying!
			</p>
			<div class="flex justify-center gap-3">
				<a
					href="/my-applications"
					class="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition"
					style="background: #0A1F44;"
					onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.background = '#0d2756')}
					onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '#0A1F44')}
				>
					View Applications
				</a>
				<a
					href="/"
					class="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
				>
					Back to Home
				</a>
			</div>
		</div>
	{:else}
		<!-- Program Info Banner -->
		{#if program}
			<div
				class="mb-5 rounded-xl border p-4"
				style="background: rgba(10,31,68,0.05); border-color: rgba(10,31,68,0.15);"
			>
				<div class="flex items-start gap-3">
					<div
						class="shrink-0 rounded-lg p-2"
						style="background: rgba(10,31,68,0.10); color: #0A1F44;"
					>
						<ClipboardList class="h-5 w-5" />
					</div>
					<div>
						<h2 class="font-bold" style="color: #0A1F44;">{program.title}</h2>
						<p class="text-sm" style="color: rgba(10,31,68,0.70);">{program.category}</p>
						<p class="mt-1 flex items-center gap-1 text-xs" style="color: rgba(10,31,68,0.55);">
							<Users class="h-3.5 w-3.5" />
							{program.slots - program.slots_used} slots remaining of {program.slots} total
						</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h1 class="mb-1 text-lg font-bold text-slate-900">Application Form</h1>
			<p class="mb-5 text-sm text-slate-500">
				Please fill out all fields correctly and completely.
			</p>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					submitApplication();
				}}
				class="space-y-4"
			>
				<div>
					<label class="label" for="fn">Full Name *</label>
					<input
						id="fn"
						bind:value={form.full_name}
						class="input"
						required
						placeholder="e.g. Juan Dela Cruz"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="label" for="age">Age *</label>
						<input
							id="age"
							bind:value={form.age}
							type="number"
							class="input"
							required
							placeholder="e.g. 18"
							min="1"
							max="30"
						/>
					</div>
					<div>
						<label class="label" for="contact">Contact Number *</label>
						<input
							id="contact"
							bind:value={form.contact}
							class="input"
							required
							placeholder="e.g. 09XXXXXXXXX"
						/>
					</div>
				</div>

				<div>
					<label class="label" for="barangay">Barangay *</label>
					<input
						id="barangay"
						bind:value={form.barangay}
						class="input"
						required
						placeholder="e.g. Barangay 123"
					/>
				</div>

				<div>
					<label class="label" for="address">Address *</label>
					<input
						id="address"
						bind:value={form.address}
						class="input"
						required
						placeholder="e.g. Blk/Lot, Street, Barangay, Lungsod"
					/>
				</div>

				<div>
					<label class="label" for="req">Requirements *</label>
					<textarea
						id="req"
						bind:value={form.requirements_submitted}
						class="input h-20 resize-none"
            required
						placeholder="e.g. Photocopy ng report card, Barangay certificate..."
					></textarea>
				</div>

				{#if error}
					<div
						class="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
					>
						<AlertCircle class="h-4 w-4 shrink-0" />
						{error}
					</div>
				{/if}

				<div class="flex gap-3 pt-1">
					<button
						type="submit"
						class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
						style="background: #0A1F44;"
						onmouseenter={(e) => {
							if (!(e.currentTarget as HTMLButtonElement).disabled)
								(e.currentTarget as HTMLElement).style.background = '#0d2756';
						}}
						onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.background = '#0A1F44')}
						disabled={submitting}
					>
						{#if submitting}
							<Loader2 class="h-4 w-4 animate-spin" />
							Isinusumite...
						{:else}
							Submit Application
						{/if}
					</button>
					<a
						href="/"
						class="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition hover:border-slate-300"
					>
						<ArrowLeft class="h-4 w-4" />
						Back
					</a>
				</div>
			</form>
		</div>
	{/if}
</div>
