<script lang="ts">
  /**
   * Bouton de thème (auto → clair → sombre). Origine : pmpa-crypto (commit 14849f5,
   * src/lib/ui/ThemeToggle.svelte), découplé de l'état de l'application :
   * l'outil passe le thème courant et enregistre le nouveau dans `onchange`.
   */
  import { nextTheme, type Theme } from '../theme';

  let { theme = 'auto', onchange }: { theme?: Theme; onchange: (theme: Theme) => void } = $props();

  const labels: Record<Theme, string> = { auto: 'Thème : automatique', light: 'Thème : clair', dark: 'Thème : sombre' };
</script>

<button class="btn btn-quiet" type="button" onclick={() => onchange(nextTheme(theme))} title={labels[theme]} aria-label={`${labels[theme]}. Changer de thème`}>
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    {#if theme === 'light'}
      <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6" />
      <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
      </g>
    {:else if theme === 'dark'}
      <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
    {:else}
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6" />
      <path d="M10 3.5a6.5 6.5 0 0 1 0 13Z" fill="currentColor" />
    {/if}
  </svg>
</button>
