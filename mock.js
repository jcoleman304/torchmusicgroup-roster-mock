/* ═══════════════════════════════════════════════
   TMG ROSTER MOCK — roster grid, artist profiles, featured strip
   Data lives in roster.json. Edit that file to change the roster.
   ═══════════════════════════════════════════════ */

const statusClass = s => 'status--' + String(s || '').toLowerCase().replace(/\s+/g, '-');
const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? ''));

async function loadRoster() {
    const res = await fetch('roster.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('roster.json failed');
    return (await res.json()).artists || [];
}

function observeReveals(root) {
    if (typeof revealObserver === 'undefined') return;
    root.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function bindCursor(root) {
    if (typeof ring === 'undefined' || typeof dot === 'undefined') return;
    root.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => { ring.style.width = '60px'; ring.style.height = '60px'; ring.style.opacity = '0.3'; dot.style.transform = 'scale(2)'; });
        el.addEventListener('mouseleave', () => { ring.style.width = '40px'; ring.style.height = '40px'; ring.style.opacity = '0.5'; dot.style.transform = 'scale(1)'; });
    });
}

function metaLine(a) {
    return [a.genre, a.hometown].filter(Boolean).join(' &middot; ');
}

/* ── Roster grid ── */
async function renderRosterGrid() {
    const grid = document.getElementById('roster-grid');
    if (!grid) return;
    const artists = await loadRoster();

    grid.innerHTML = artists.map((a, i) => `
        <div class="artist-strip-card reveal ${i % 3 ? 'reveal-delay-' + (i % 3) : ''}" data-division="${esc(a.division)}" data-status="${esc(a.status)}">
            <a href="artist.html?a=${encodeURIComponent(a.slug)}" class="roster-card-link">
                <div class="artist-strip-img has-photo">
                    <span class="status-tag ${statusClass(a.status)}">${esc(a.status)}</span>
                    <img src="${esc(a.photo)}" alt="${esc(a.name)}" class="artist-photo" loading="lazy">
                </div>
            </a>
            <div class="artist-strip-info">
                <div class="artist-meta">${metaLine(a)}</div>
                <h3><a href="artist.html?a=${encodeURIComponent(a.slug)}" class="roster-card-link">${esc(a.name)}</a></h3>
                <p class="artist-descriptor">${esc(a.descriptor)}</p>
                <div class="artist-strip-links">
                    <a href="artist.html?a=${encodeURIComponent(a.slug)}" class="artist-link">Profile</a>
                    ${a.links && a.links.spotify && a.links.spotify !== '#' ? `<a href="${esc(a.links.spotify)}" target="_blank" rel="noopener" class="artist-link">Listen</a>` : ''}
                    ${a.links && a.links.instagram && a.links.instagram !== '#' ? `<a href="${esc(a.links.instagram)}" target="_blank" rel="noopener" class="artist-link">Follow</a>` : ''}
                </div>
                ${a.real ? '' : '<div class="imagined-note">Imagined artist &middot; mock</div>'}
            </div>
        </div>
    `).join('');

    const count = document.getElementById('roster-count');
    if (count) { const im = artists.filter(a => !a.real).length; count.textContent = `${artists.length} artists` + (im ? ` · ${artists.length - im} real · ${im} imagined` : ''); }

    // Division summary
    const divs = document.getElementById('roster-divisions');
    if (divs) {
        const desc = {
            'Management': 'Career strategy, releases, touring, brand, and the day-to-day business of being an artist.',
            'Publishing': 'Writers and producers whose catalog and placements compound across the whole roster.',
            'Development': 'Artists in the build: voice, identity, songs, and a first impression worth waiting for.'
        };
        divs.innerHTML = ['Management', 'Publishing', 'Development'].map(d => `
            <div class="roster-division reveal">
                <div class="roster-division-num">${artists.filter(a => a.division === d).length}</div>
                <div class="roster-division-name">${d}</div>
                <div class="roster-division-desc">${desc[d]}</div>
            </div>`).join('');
    }

    // Filters
    document.querySelectorAll('.roster-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.roster-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            grid.querySelectorAll('.artist-strip-card').forEach(card => {
                const show = f === 'all' || card.dataset.division === f || card.dataset.status === f;
                card.classList.toggle('is-hidden', !show);
                if (show) card.classList.add('visible');
            });
        });
    });

    observeReveals(grid);
    if (divs) observeReveals(divs);
    bindCursor(grid);
}

/* ── Artist profile ── */
async function renderArtistPage() {
    const root = document.getElementById('artist-root');
    if (!root) return;
    const artists = await loadRoster();
    const slug = new URLSearchParams(location.search).get('a') || artists[0].slug;
    const idx = artists.findIndex(a => a.slug === slug);
    if (idx < 0) { root.innerHTML = '<p class="releases-empty-dark">Artist not found. <a href="roster.html" class="artist-back">Back to roster</a></p>'; return; }
    const a = artists[idx];
    const prev = artists[(idx - 1 + artists.length) % artists.length];
    const next = artists[(idx + 1) % artists.length];
    document.title = `${a.name} — Torch Music Group`;

    // Releases: mock releases from roster.json + real ones from releases.json
    let real = [];
    try {
        const r = await fetch('releases.json', { cache: 'no-store' });
        const data = await r.json();
        const all = [...(data.releases || []), ...(data.manual_releases || [])];
        const key = a.name.split('/')[0].trim().toLowerCase();
        const aliases = a.name.split('/').map(s => s.trim().toLowerCase());
        real = all.filter(x => aliases.includes(String(x.artist || '').toLowerCase()) || aliases.some(al => String(x.writers || '').toLowerCase().includes(al)))
            .map(x => ({ title: x.title, type: x.writers && !aliases.includes(String(x.artist).toLowerCase()) ? `${x.artist} · writer` : (x.subtitle || x.type), date: x.release_date, cover: x.cover_url, url: x.spotify_url }));
        void key;
    } catch (e) { /* no releases.json */ }
    const releases = [...(a.releases || []), ...real].sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')));

    const stats = a.stats ? `
        <div class="artist-stats">
            <div class="artist-stat"><div class="artist-stat-val">${esc(a.stats.monthly_listeners)}</div><div class="artist-stat-key">Monthly Listeners</div></div>
            <div class="artist-stat"><div class="artist-stat-val">${esc(a.stats.followers)}</div><div class="artist-stat-key">Followers</div></div>
            <div class="artist-stat"><div class="artist-stat-val" style="font-size:16px;line-height:1.4">${esc(a.stats.top_market)}</div><div class="artist-stat-key">Top Markets</div></div>
        </div>
        <div class="artist-stats-note">${a.real ? 'Figures are placeholders until verified' : 'Illustrative figures for an imagined artist'}</div>` : '';

    root.innerHTML = `
        <a href="roster.html" class="artist-back">&larr; Back to the Roster</a>
        <div class="artist-hero">
            <div class="artist-hero-photo reveal">
                <span class="status-tag ${statusClass(a.status)}">${esc(a.status)}</span>
                <img src="${esc(a.photo)}" alt="${esc(a.name)}">
            </div>
            <div class="artist-hero-copy">
                <div class="artist-kicker reveal">${esc(a.division)}${a.hometown ? ' &middot; ' + esc(a.hometown) : ''}${a.real ? '' : ' &middot; Imagined'}</div>
                <h1 class="artist-name reveal">${esc(a.name)}</h1>
                <p class="artist-tagline reveal reveal-delay-1">${esc(a.descriptor)}</p>
                <div class="artist-actions reveal reveal-delay-1">
                    <a href="${esc(a.links?.spotify || '#')}" target="_blank" rel="noopener" class="artist-link ${!a.links?.spotify || a.links.spotify === '#' ? 'is-disabled' : ''}">Listen</a>
                    <a href="${esc(a.links?.instagram || '#')}" target="_blank" rel="noopener" class="artist-link ${!a.links?.instagram || a.links.instagram === '#' ? 'is-disabled' : ''}">Follow</a>
                    <a href="contact.html" class="artist-link">Bookings &amp; Inquiries</a>
                </div>
                <div class="artist-bio reveal reveal-delay-2">${(a.bio || []).map(p => `<p>${esc(p)}</p>`).join('')}</div>
                <div class="artist-sound reveal reveal-delay-2">${(a.sound || []).map(s => `<span class="sound-tag">${esc(s)}</span>`).join('')}</div>
                <div class="reveal reveal-delay-2">${stats}</div>
                <div class="artist-facts reveal reveal-delay-3">
                    <div><div class="artist-fact-key">Genre</div><div class="artist-fact-val">${esc(a.genre)}</div></div>
                    <div><div class="artist-fact-key">Division</div><div class="artist-fact-val">TMG ${esc(a.division)}</div></div>
                    <div><div class="artist-fact-key">Hometown</div><div class="artist-fact-val">${esc(a.hometown || 'TBD')}</div></div>
                    <div><div class="artist-fact-key">With Torch Since</div><div class="artist-fact-val">${esc(a.since)}</div></div>
                </div>
                <div class="artist-releases reveal reveal-delay-3">
                    <div class="section-label">Releases</div>
                    ${releases.length ? `<div class="music-grid">${releases.map(r => `
                        <a href="${esc(r.url || a.links?.spotify || '#')}" ${r.url ? 'target="_blank" rel="noopener"' : ''} class="music-card">
                            <div class="music-cover">${r.cover ? `<img src="${esc(r.cover)}" alt="${esc(r.title)}" class="music-cover-img">` : ''}<div class="music-play"><svg viewBox="0 0 24 24"><polygon points="8,5 20,12 8,19"/></svg></div></div>
                            <div class="music-title">${esc(r.title)}</div>
                            <div class="music-artist">${esc(r.type || '')}${r.date ? ' · ' + String(r.date).slice(0, 4) : ''}</div>
                        </a>`).join('')}</div>`
                    : '<p class="releases-empty-dark">Debut in development. First release to be announced.</p>'}
                </div>
            </div>
        </div>
        <div class="artist-nav">
            <a href="artist.html?a=${encodeURIComponent(prev.slug)}" class="prev"><span>&larr; Previous</span>${esc(prev.name)}</a>
            <a href="artist.html?a=${encodeURIComponent(next.slug)}" class="next"><span>Next &rarr;</span>${esc(next.name)}</a>
        </div>`;

    observeReveals(root);
    bindCursor(root);
}

/* ── Homepage featured ── */
async function renderFeatured() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const artists = await loadRoster();
    const picks = [...artists.filter(a => a.status === 'Flagship'), ...artists.filter(a => a.status === 'New Signing')].slice(0, 4);
    grid.innerHTML = picks.map((a, i) => `
        <a href="artist.html?a=${encodeURIComponent(a.slug)}" class="featured-card reveal ${i ? 'reveal-delay-' + Math.min(i, 3) : ''}">
            <img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy">
            <div class="featured-card-info"><h3>${esc(a.name)}</h3><p>${metaLine(a)}</p></div>
        </a>`).join('');
    observeReveals(grid);
    bindCursor(grid);
}

renderRosterGrid().catch(console.error);
renderArtistPage().catch(console.error);
renderFeatured().catch(console.error);
