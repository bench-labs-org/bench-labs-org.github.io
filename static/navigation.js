/**
 * Dynamic Shared Header and Footer for Bench Labs pages.
 * Simply include this script at the bottom of the body (or top with defer).
 */
(function() {
  // Common tailwind CSS classes & HTML elements setup
  const pathname = window.location.pathname;
  const isHome = pathname.endsWith('index.html') || pathname.endsWith('/') || !pathname.includes('.html');
  const isModels = pathname.includes('models.html') || pathname.includes('text-to-image.html') || pathname.includes('text-to-3d.html');
  const isBenchmarks = pathname.includes('benchmarks.html');
  const isPartnerships = pathname.includes('partnerships.html');

  const navItems = [
    { name: 'Home', url: isHome ? '#hero' : 'index.html', active: isHome && !pathname.includes('partnerships') && !pathname.includes('benchmarks') },
    { name: 'Models', url: 'models.html', active: isModels },
    { name: 'Benchmarks', url: 'benchmarks.html', active: isBenchmarks },
    { name: 'Partnerships', url: 'partnerships.html', active: isPartnerships },
    { name: 'Discord', url: 'https://discord.gg/zRzbNJBVQQ', external: true }
  ];

  // Render Header
  const headerHTML = `
    <header class="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl h-16 items-center justify-between px-6">
        <a href="${isHome ? '#hero' : 'index.html'}" class="flex items-center gap-2.5 group">
          <img src="static/logo-benchlabs.png" alt="Bench Labs Logo" class="h-8 w-8 object-contain transition-transform group-hover:scale-105" onerror="this.src='https://huggingface.co/front/assets/huggingface_logo-noborder.svg'">
          <span class="text-lg font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">Bench Labs</span>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1">
          ${navItems.map(item => `
            <a href="${item.url}"
               ${item.external ? 'target="_blank" rel="noopener"' : ''}
               class="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200
               ${item.active
                 ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                 : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}"
            >
              ${item.name}
              ${item.external ? '<span class="text-xs text-zinc-600 ml-0.5">↗</span>' : ''}
            </a>
          `).join('')}
        </nav>

        <!-- Mobile Menu Button -->
        <button id="mobile-menu-btn" type="button" class="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 focus:outline-none" aria-label="Toggle menu">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path id="menu-icon-path" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Mobile Menu Panel -->
      <div id="mobile-menu" class="hidden md:hidden border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-lg px-6 py-4 space-y-2">
        ${navItems.map(item => `
          <a href="${item.url}"
             ${item.external ? 'target="_blank" rel="noopener"' : ''}
             class="block px-4 py-2.5 rounded-lg text-base font-medium transition-colors
             ${item.active
               ? 'bg-zinc-800 text-zinc-100'
               : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}"
          >
            ${item.name}
            ${item.external ? '<span class="text-xs text-zinc-500 ml-1">↗</span>' : ''}
          </a>
        `).join('')}
      </div>
    </header>
  `;

  // Render Footer
  const footerHTML = `
    <footer class="border-t border-zinc-900 bg-zinc-950 py-8 mt-auto">
      <div class="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p class="text-xs text-zinc-500">
          &copy; ${new Date().getFullYear()} Bench Labs. Released under permissive open source licenses.
        </p>
        <div class="flex items-center gap-6">
          <a class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" href="https://huggingface.co/bench-labs" target="_blank" rel="noopener">Hugging Face</a>
          <a class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" href="https://github.com/bench-labs-org" target="_blank" rel="noopener">GitHub</a>
          <a class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" href="https://discord.gg/zRzbNJBVQQ" target="_blank" rel="noopener">Discord</a>
        </div>
      </div>
    </footer>
  `;

  // Inject into document
  const body = document.body;

  // Inject Header at the beginning of body
  const tempDivHeader = document.createElement('div');
  tempDivHeader.innerHTML = headerHTML.trim();
  body.insertBefore(tempDivHeader.firstChild, body.firstChild);

  // Inject Footer at the end of body
  const tempDivFooter = document.createElement('div');
  tempDivFooter.innerHTML = footerHTML.trim();
  body.appendChild(tempDivFooter.firstChild);

  // Handle mobile menu interaction
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIconPath = document.getElementById('menu-icon-path');

  if (mobileMenuBtn && mobileMenu) {
    let isOpen = false;
    mobileMenuBtn.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) {
        mobileMenu.classList.remove('hidden');
        menuIconPath.setAttribute('d', 'M6 18L18 6M6 6l12 12'); // X icon
      } else {
        mobileMenu.classList.add('hidden');
        menuIconPath.setAttribute('d', 'M4 6h16M4 12h16M4 18h16'); // Hamburger icon
      }
    });
  }
})();
