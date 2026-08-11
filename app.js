(function () {
    'use strict';

    const STORAGE_KEY = 'inventaireForestierV28';
    const LEGACY_STORAGE_KEYS = ['inventaireForestierV27', 'inventaireForestierV26', 'inventaireForestierV25', 'inventaireForestierV23', 'inventaireForestierV22', 'inventaireForestierV21', 'inventaireForestierV2'];

    const TYPES = {
        standard: {
            label: 'Essences hors feuillus précieux, peupliers, noyers',
            objectiveDensity: 900,
            sampleMode: 'surface'
        },
        precious: {
            label: 'Feuillus précieux',
            objectiveDensity: 800,
            sampleMode: 'surface'
        },
        poplarWalnut: {
            label: 'Peupliers et noyers',
            objectiveDensity: 130,
            sampleMode: 'full'
        },
        regionalExemption: {
            label: 'Essence avec une dérogation régionale',
            objectiveDensity: null,
            sampleMode: 'surface'
        }
    };


    const CHECKLIST_ITEMS = [
        {
            id: 'remanents-souches',
            title: 'Rémanents et souches',
            detail: 'Vérification que les rémanents et souches n’ont pas été exportés.',
            type: 'Obligatoire'
        },
        {
            id: 'preparation-sol',
            title: 'Préparation du sol',
            detail: 'Si un labour en bandes a été effectué sur moins de 50 % de la surface, vérification que la texture est à dominante sableuse.',
            type: 'Le cas échéant'
        },
        {
            id: 'arbres-isoles-haies-bordures',
            title: 'Arbres isolés, haies, bordures boisées préexistants au projet',
            detail: 'Vérification de leur présence et de l’absence d’éléments (souches…) qui prouveraient une coupe de ces éléments, en s’appuyant sur le document 2E.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-biodiversite-diversification',
            title: 'Co-bénéfice « biodiversité » et diversification en essences',
            detail: 'Vérification que les critères de diversification ont été appliqués (par passage dans les différents tènements).',
            type: 'Obligatoire'
        },
        {
            id: 'arbres-interet-ecologique',
            title: 'Maintien d’arbres d’intérêt écologique',
            detail: 'Vérification de leur présence d’après les éléments fournis sur le document 3B ou 4.',
            type: 'Le cas échéant'
        },
        {
            id: 'diagnostic-ibp',
            title: 'Diagnostic IBP',
            detail: 'Diagnostic IBP à réaliser et vérification que la note de l’IBP n’a pas été dégradée sur le critère A et qu’elle n’a pas baissé de plus de 3 points sur les critères C, D, E et F cumulés.',
            type: 'Le cas échéant'
        },
        {
            id: 'verification-station',
            title: 'Vérification de la station',
            detail: 'Sondage à réaliser, avec relevé de profondeur et de texture et vérification des classes de fertilité choisies par le porteur de projet dans le document 3.',
            type: 'Obligatoire'
        },
        {
            id: 'correction-erreur-diagnostic',
            title: 'Correction suite à une erreur de diagnostic stationnel ou de fertilité de la part du porteur de projet',
            detail: 'Demande au porteur de projet de refaire les calculs + vérification du calculateur déposé par le porteur de projet.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-sol',
            title: 'Co-bénéfice « sol »',
            detail: 'Vérification du nettoyage ou broyage des rémanents après exploitation de la parcelle.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-biodiversite-bordures',
            title: 'Co-bénéfice « biodiversité »',
            detail: 'Vérification que des bordures feuillues ont bien été créées.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-biodiversite-arbres-ecologiques',
            title: 'Co-bénéfice « biodiversité »',
            detail: 'Vérification que des arbres d’intérêt écologique ont bien été maintenus.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-biodiversite-haies',
            title: 'Co-bénéfice « biodiversité »',
            detail: 'Vérification que des haies ou des arbres isolés ou bocagers ont bien été maintenus.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-biodiversite-implantation',
            title: 'Co-bénéfice « biodiversité »',
            detail: 'Vérification du type d’implantation de la diversification (en bandes, par bouquets, pied à pied).',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-biodiversite-gros-bois',
            title: 'Co-bénéfice « biodiversité »',
            detail: 'Vérification du maintien des gros bois et des bois porteurs de micro-habitats.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-eau-resineux',
            title: 'Co-bénéfice « eau »',
            detail: 'Vérification que les résineux sont bien implantés à plus de 10 m des bordures de cours d’eau.',
            type: 'Le cas échéant'
        },
        {
            id: 'cobenefice-eau-mare-ripisylve',
            title: 'Co-bénéfice « eau »',
            detail: 'Vérification qu’une mare ou une ripisylve a été créée.',
            type: 'Le cas échéant'
        }
    ];

    const state = {
        alive: 0,
        dead: 0,
        stands: [],
        checklist: {},
        current: {
            standName: '',
            inventoryDate: todayISO(),
            standType: 'standard',
            surfaceHa: '',
            initialDensity: '',
            objectiveDensity: 900,
            durationHours: '',
            durationMinutes: ''
        }
    };

    const $ = (id) => document.getElementById(id);

    const els = {
        standName: $('standName'),
        inventoryDate: $('inventoryDate'),
        standType: $('standType'),
        surfaceHa: $('surfaceHa'),
        initialDensity: $('initialDensity'),
        objectiveDensity: $('objectiveDensity'),
        durationHours: $('durationHours'),
        durationMinutes: $('durationMinutes'),
        aliveValue: $('aliveValue'),
        deadValue: $('deadValue'),
        alivePercent: $('alivePercent'),
        progressBar: $('progressBar'),
        totalTrees: $('totalTrees'),
        samplePercent: $('samplePercent'),
        plantsToCount: $('plantsToCount'),
        plantsCounted: $('plantsCounted'),
        plantsRemaining: $('plantsRemaining'),
        livingDensity: $('livingDensity'),
        durationDisplay: $('durationDisplay'),
        manualCounter: $('manualCounter'),
        manualAmount: $('manualAmount'),
        manualMinus: $('manualMinus'),
        manualPlus: $('manualPlus'),
        countingStatus: $('countingStatus'),
        successStatus: $('successStatus'),
        countingStatusCard: $('countingStatusCard'),
        successStatusCard: $('successStatusCard'),
        summaryBody: $('summaryBody'),
        emptySummaryRow: $('emptySummaryRow'),
        sumDuration: $('sumDuration'),
        sumAlive: $('sumAlive'),
        sumDead: $('sumDead'),
        sumPercent: $('sumPercent'),
        sumLivingDensity: $('sumLivingDensity'),
        sumPlantsToCount: $('sumPlantsToCount'),
        sumPlantsCounted: $('sumPlantsCounted'),
        sumCountingStatus: $('sumCountingStatus'),
        sumSuccessStatus: $('sumSuccessStatus'),
        toast: $('toast'),
        checklistList: $('checklistList'),
        checklistProgress: $('checklistProgress'),
        exportChecklistCsv: $('exportChecklistCsv'),
        resetChecklist: $('resetChecklist')
    };

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        loadState();
        initializeChecklistState();
        bindEvents();
        syncFormFromState();
        updateObjectiveField();
        renderAll();
        registerServiceWorker();
    }

    function bindEvents() {
        document.querySelectorAll('.tab-button').forEach((button) => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        document.querySelectorAll('.touch-zone').forEach((button) => {
            button.addEventListener('click', () => {
                const counter = button.dataset.counter;
                const action = button.dataset.action;
                changeCounter(counter, action === 'plus' ? 1 : -1);
            });
        });

        ['input', 'change'].forEach((eventName) => {
            els.standName.addEventListener(eventName, updateCurrentFromForm);
            els.inventoryDate.addEventListener(eventName, updateCurrentFromForm);
            els.surfaceHa.addEventListener(eventName, updateCurrentFromForm);
            els.initialDensity.addEventListener(eventName, updateCurrentFromForm);
            els.objectiveDensity.addEventListener(eventName, updateCurrentFromForm);
            els.durationHours.addEventListener(eventName, updateCurrentFromForm);
            els.durationMinutes.addEventListener(eventName, updateCurrentFromForm);
        });

        els.standType.addEventListener('change', () => {
            updateObjectiveField();
            updateCurrentFromForm();
        });

        $('saveStand').addEventListener('click', saveStand);
        $('newStand').addEventListener('click', newStand);
        $('exportCsv').addEventListener('click', exportCsv);
        $('clearAllData').addEventListener('click', clearAllData);
        els.manualMinus.addEventListener('click', () => manualAdjust(-1));
        els.manualPlus.addEventListener('click', () => manualAdjust(1));
        els.manualAmount.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') manualAdjust(1);
        });

        els.summaryBody.addEventListener('click', (event) => {
            const button = event.target.closest('[data-delete-id]');
            if (!button) return;
            deleteStand(button.dataset.deleteId);
        });

        els.checklistList.addEventListener('change', (event) => {
            const input = event.target.closest('input[type=\"radio\"]');
            if (!input) return;
            const itemId = input.name.replace('checklist-', '');
            const currentValue = normalizeChecklistItem(state.checklist[itemId]);
            state.checklist[itemId] = {
                answer: input.value,
                comment: currentValue.comment
            };
            renderChecklist();
            persist();
        });

        els.checklistList.addEventListener('input', (event) => {
            const textarea = event.target.closest('[data-check-comment]');
            if (!textarea) return;
            const itemId = textarea.dataset.checkComment;
            const currentValue = normalizeChecklistItem(state.checklist[itemId]);
            state.checklist[itemId] = {
                answer: currentValue.answer,
                comment: textarea.value
            };
            persist();
        });

        els.exportChecklistCsv.addEventListener('click', exportChecklistCsv);
        els.resetChecklist.addEventListener('click', resetChecklist);
    }

    function changeCounter(counter, delta) {
        if (counter === 'alive') state.alive = Math.max(0, state.alive + delta);
        if (counter === 'dead') state.dead = Math.max(0, state.dead + delta);

        animateCounter(counter);
        vibrate(18);
        renderAll();
        persist();
    }


    function manualAdjust(direction) {
        const counter = els.manualCounter.value;
        const amount = Math.max(1, Math.round(toNumber(els.manualAmount.value)));

        if (!amount || amount <= 0) {
            showToast('Renseigne un nombre de plants valide.');
            els.manualAmount.focus();
            return;
        }

        changeCounter(counter, direction * amount);
        els.manualAmount.value = '';
        const label = counter === 'alive' ? 'plants vivants' : 'plants morts';
        showToast(`${amount} ${label} ${direction > 0 ? 'ajoutés' : 'retirés'}.`);
    }

    function animateCounter(counter) {
        const valueEl = counter === 'alive' ? els.aliveValue : els.deadValue;
        const cardEl = counter === 'alive' ? $('aliveCard') : $('deadCard');
        valueEl.classList.remove('bump');
        cardEl.classList.remove('flash');
        void valueEl.offsetWidth;
        valueEl.classList.add('bump');
        cardEl.classList.add('flash');
        setTimeout(() => {
            valueEl.classList.remove('bump');
            cardEl.classList.remove('flash');
        }, 160);
    }

    function updateCurrentFromForm() {
        state.current.standName = els.standName.value.trim();
        state.current.inventoryDate = els.inventoryDate.value || todayISO();
        state.current.standType = els.standType.value;
        state.current.surfaceHa = normalizeDecimalInput(els.surfaceHa.value);
        state.current.initialDensity = normalizeDecimalInput(els.initialDensity.value);
        state.current.objectiveDensity = normalizeDecimalInput(els.objectiveDensity.value);
        state.current.durationHours = normalizeIntegerInput(els.durationHours.value);
        state.current.durationMinutes = els.durationMinutes.value === '' ? '' : clamp(Math.round(toNumber(els.durationMinutes.value)), 0, 59).toString();
        renderAll();
        persist();
    }

    function updateObjectiveField() {
        const type = TYPES[els.standType.value];
        if (type.objectiveDensity === null) {
            els.objectiveDensity.readOnly = false;
            els.objectiveDensity.placeholder = 'À renseigner';
            if (state.current.standType !== 'regionalExemption') els.objectiveDensity.value = '';
        } else {
            els.objectiveDensity.readOnly = true;
            els.objectiveDensity.value = type.objectiveDensity;
        }
    }

    function syncFormFromState() {
        els.standName.value = state.current.standName || '';
        els.inventoryDate.value = state.current.inventoryDate || todayISO();
        els.standType.value = state.current.standType || 'standard';
        els.surfaceHa.value = state.current.surfaceHa || '';
        els.initialDensity.value = state.current.initialDensity || '';
        els.objectiveDensity.value = state.current.objectiveDensity || '';
        els.durationHours.value = state.current.durationHours || '';
        els.durationMinutes.value = state.current.durationMinutes || '';
    }

    function getCurrentComputed() {
        const standType = state.current.standType || 'standard';
        const typeConfig = TYPES[standType] || TYPES.standard;
        const surfaceHa = toNumber(state.current.surfaceHa);
        const initialDensity = toNumber(state.current.initialDensity);
        const objectiveDensity = toNumber(state.current.objectiveDensity);
        const durationHours = Math.max(0, Math.round(toNumber(state.current.durationHours)));
        const durationMinutes = clamp(Math.round(toNumber(state.current.durationMinutes)), 0, 59);
        const durationTotalMinutes = durationHours * 60 + durationMinutes;
        const alive = state.alive;
        const dead = state.dead;
        const counted = alive + dead;
        const aliveRate = counted > 0 ? alive / counted : 0;
        const sampleRate = getSampleRate(standType, surfaceHa);
        const plantsToCount = Math.round(surfaceHa * initialDensity * sampleRate);
        const plantsRemaining = Math.max(0, plantsToCount - counted);
        const livingDensity = Math.round(initialDensity * aliveRate);
        const countingOk = counted >= plantsToCount && plantsToCount > 0;
        const successOk = livingDensity >= objectiveDensity && objectiveDensity > 0;

        return {
            id: String(Date.now()),
            date: state.current.inventoryDate || todayISO(),
            name: state.current.standName,
            typeKey: standType,
            typeLabel: typeConfig.label,
            objectiveDensity,
            surfaceHa,
            durationHours,
            durationMinutes,
            durationTotalMinutes,
            sampleRate,
            samplePercent: sampleRate * 100,
            initialDensity,
            alive,
            dead,
            counted,
            aliveRate,
            alivePercent: aliveRate * 100,
            livingDensity,
            plantsToCount,
            plantsRemaining,
            countingOk,
            successOk
        };
    }

    function getSampleRate(typeKey, surfaceHa) {
        if (typeKey === 'poplarWalnut') return 1;
        if (surfaceHa > 4) return 0.10;
        if (surfaceHa > 0) return 0.20;
        return 0;
    }

    function renderAll() {
        renderCounters();
        renderStats();
        renderSummary();
        renderChecklist();
    }

    function renderCounters() {
        els.aliveValue.textContent = formatInteger(state.alive);
        els.deadValue.textContent = formatInteger(state.dead);
    }

    function renderStats() {
        const c = getCurrentComputed();
        els.alivePercent.textContent = formatPercent(c.alivePercent);
        els.progressBar.style.width = `${clamp(c.alivePercent, 0, 100)}%`;
        els.totalTrees.textContent = `${formatInteger(c.counted)} ${c.counted > 1 ? 'plants comptabilisés' : 'plant comptabilisé'}`;
        els.samplePercent.textContent = formatPercent(c.samplePercent, 0);
        els.plantsToCount.textContent = formatInteger(c.plantsToCount);
        els.plantsCounted.textContent = formatInteger(c.counted);
        els.plantsRemaining.textContent = formatInteger(c.plantsRemaining);
        els.livingDensity.textContent = formatInteger(c.livingDensity);
        els.durationDisplay.textContent = formatDuration(c.durationTotalMinutes);
        els.countingStatus.textContent = c.countingOk ? '✅' : '❌';
        els.successStatus.textContent = c.successOk ? '✅' : '❌';
        setStatusClass(els.countingStatusCard, c.countingOk);
        setStatusClass(els.successStatusCard, c.successOk);
    }

    function renderSummary() {
        const rows = state.stands;
        els.summaryBody.innerHTML = '';

        if (rows.length === 0) {
            const tr = document.createElement('tr');
            tr.id = 'emptySummaryRow';
            tr.innerHTML = '<td colspan="16" class="empty-state">Aucun tènement enregistré pour le moment.</td>';
            els.summaryBody.appendChild(tr);
        } else {
            rows.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="N°">${index + 1}</td>
                    <td data-label="Tènement" class="name-cell">${escapeHtml(row.name)}</td>
                    <td data-label="Type" class="type-cell">${escapeHtml(row.typeLabel)}</td>
                    <td data-label="Objectif densité">${formatInteger(row.objectiveDensity)}</td>
                    <td data-label="Surface">${formatDecimal(row.surfaceHa, 2)}</td>
                    <td data-label="Comptage statistique">${formatPercent(row.samplePercent, 0)}</td>
                    <td data-label="Densité initiale">${formatInteger(row.initialDensity)}</td>
                    <td data-label="Plants vivants">${formatInteger(row.alive)}</td>
                    <td data-label="Plants morts">${formatInteger(row.dead)}</td>
                    <td data-label="Taux vivants">${formatPercent(row.alivePercent, 0)}</td>
                    <td data-label="Densité vivante">${formatInteger(row.livingDensity)}</td>
                    <td data-label="Plants à compter">${formatInteger(row.plantsToCount)}</td>
                    <td data-label="Plants comptés">${formatInteger(row.counted)}</td>
                    <td data-label="Comptage stat." class="status-icon">${row.countingOk ? '✅' : '❌'}</td>
                    <td data-label="Réussite" class="status-icon">${row.successOk ? '✅' : '❌'}</td>
                    <td data-label="Action"><button class="delete-row-button" type="button" data-delete-id="${row.id}" aria-label="Supprimer ce tènement">×</button></td>
                `;
                els.summaryBody.appendChild(tr);
            });
        }

        renderTotals();
    }

    function renderTotals() {
        const totalAlive = state.stands.reduce((sum, row) => sum + row.alive, 0);
        const totalDead = state.stands.reduce((sum, row) => sum + row.dead, 0);
        const totalCounted = totalAlive + totalDead;
        const totalAlivePercent = totalCounted > 0 ? (totalAlive / totalCounted) * 100 : 0;
        const totalPlantsToCount = state.stands.reduce((sum, row) => sum + row.plantsToCount, 0);
        const totalDurationMinutes = state.stands.reduce((sum, row) => sum + (row.durationTotalMinutes || 0), 0);
        const totalInitialPlants = state.stands.reduce((sum, row) => sum + (row.surfaceHa * row.initialDensity), 0);
        const weightedLivingPlants = state.stands.reduce((sum, row) => sum + (row.surfaceHa * row.livingDensity), 0);
        const weightedLivingDensity = totalInitialPlants > 0
            ? Math.round(weightedLivingPlants / state.stands.reduce((sum, row) => sum + row.surfaceHa, 0))
            : 0;
        const countingOk = totalCounted >= totalPlantsToCount && totalPlantsToCount > 0;
        const successOk = state.stands.length > 0 && state.stands.every((row) => row.successOk);

        els.sumAlive.textContent = formatInteger(totalAlive);
        els.sumDead.textContent = formatInteger(totalDead);
        els.sumPercent.textContent = formatPercent(totalAlivePercent, 0);
        els.sumLivingDensity.textContent = formatInteger(weightedLivingDensity);
        els.sumPlantsToCount.textContent = formatInteger(totalPlantsToCount);
        els.sumPlantsCounted.textContent = formatInteger(totalCounted);
        els.sumCountingStatus.textContent = countingOk ? '✅' : '❌';
        els.sumSuccessStatus.textContent = successOk ? '✅' : '❌';
    }


    function switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach((button) => {
            const active = button.dataset.tab === tabName;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        document.querySelectorAll('.tab-panel').forEach((panel) => {
            const active = panel.dataset.panel === tabName;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function createEmptyChecklist() {
        return CHECKLIST_ITEMS.reduce((acc, item) => {
            acc[item.id] = {
                answer: '',
                comment: ''
            };
            return acc;
        }, {});
    }

    function normalizeChecklistItem(value) {
        if (typeof value === 'string') {
            return { answer: value, comment: '' };
        }
        if (value && typeof value === 'object') {
            return {
                answer: value.answer || '',
                comment: value.comment || ''
            };
        }
        return { answer: '', comment: '' };
    }

    function initializeChecklistState() {
        const base = createEmptyChecklist();
        const savedChecklist = state.checklist || {};
        CHECKLIST_ITEMS.forEach((item) => {
            base[item.id] = normalizeChecklistItem(savedChecklist[item.id]);
        });
        state.checklist = base;
    }

    function renderChecklist() {
        if (!els.checklistList) return;

        const answered = CHECKLIST_ITEMS.filter((item) => Boolean(normalizeChecklistItem(state.checklist[item.id]).answer)).length;
        els.checklistProgress.textContent = `${answered} / ${CHECKLIST_ITEMS.length} complété${answered > 1 ? 's' : ''}`;

        els.checklistList.innerHTML = CHECKLIST_ITEMS.map((item, index) => {
            const checklistValue = normalizeChecklistItem(state.checklist[item.id]);
            const value = checklistValue.answer;
            const comment = checklistValue.comment;
            const typeClass = item.type === 'Obligatoire' ? 'mandatory' : 'conditional';
            const options = [['oui', 'Oui'], ['non', 'Non'], ['na', 'N/A'], ['non_audite', 'Non audité']];
            const optionHtml = options.map(([optionValue, label]) => `
                <label class="check-option ${value === optionValue ? 'selected' : ''}">
                    <input type="radio" name="checklist-${item.id}" value="${optionValue}" ${value === optionValue ? 'checked' : ''}>
                    <span>${label}</span>
                </label>
            `).join('');

            return `
                <article class="check-item ${value || comment ? 'answered' : ''}">
                    <div class="check-item-main">
                        <div class="check-item-header">
                            <span class="check-index">${index + 1}</span>
                            <span class="check-type ${typeClass}">${escapeHtml(item.type)}</span>
                        </div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.detail)}</p>
                    </div>
                    <div class="check-response">
                        <div class="check-options" role="radiogroup" aria-label="Réponse pour ${escapeHtml(item.title)}">
                            ${optionHtml}
                        </div>
                        <label class="check-comment-label" for="comment-${item.id}">Commentaire</label>
                        <textarea id="comment-${item.id}" class="check-comment" data-check-comment="${item.id}" rows="3" placeholder="Commentaire terrain facultatif...">${escapeHtml(comment)}</textarea>
                    </div>
                </article>
            `;
        }).join('');
    }

    function resetChecklist() {
        if (!confirm('Réinitialiser toutes les réponses de la checklist ?')) return;
        state.checklist = createEmptyChecklist();
        renderChecklist();
        persist();
        showToast('Checklist réinitialisée.');
    }

    function exportChecklistCsv() {
        const headers = ['Date', 'Tènement en cours', 'N°', 'Question', 'Type', 'Réponse', 'Commentaire'];
        const lines = [headers.join(';')];
        CHECKLIST_ITEMS.forEach((item, index) => {
            lines.push([
                state.current.inventoryDate || todayISO(),
                csvCell(state.current.standName || ''),
                index + 1,
                csvCell(`${item.title} - ${item.detail}`),
                csvCell(item.type),
                csvCell(formatChecklistAnswer(normalizeChecklistItem(state.checklist[item.id]).answer)),
                csvCell(normalizeChecklistItem(state.checklist[item.id]).comment)
            ].join(';'));
        });

        const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `checklist_terrain_${todayISO()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Export checklist CSV généré.');
    }

    function formatChecklistAnswer(value) {
        if (value === 'oui') return 'Oui';
        if (value === 'non') return 'Non';
        if (value === 'na') return 'N/A';
        if (value === 'non_audite') return 'Non audité';
        return 'Non renseigné';
    }

    function saveStand() {
        updateCurrentFromForm();
        renderAll();
        persist();
        showToast('Saisie sauvegardée. Clique sur Nouveau tènement pour l’ajouter au récapitulatif.');
        vibrate(25);
    }

    function newStand() {
        updateCurrentFromForm();
        const row = getCurrentComputed();

        if (!row.name) {
            showToast('Renseigne le nom du tènement.');
            els.standName.focus();
            return;
        }
        if (row.surfaceHa <= 0) {
            showToast('Renseigne une surface valide.');
            els.surfaceHa.focus();
            return;
        }
        if (row.initialDensity <= 0) {
            showToast('Renseigne une densité initiale valide.');
            els.initialDensity.focus();
            return;
        }
        if (row.objectiveDensity <= 0) {
            showToast('Renseigne un objectif de densité valide.');
            els.objectiveDensity.focus();
            return;
        }
        if (row.counted <= 0) {
            showToast('Compte au moins un plant avant de passer au tènement suivant.');
            return;
        }

        state.stands.push(row);
        resetCurrentCountersAndName();
        renderAll();
        persist();
        showToast('Tènement ajouté au récapitulatif. Nouveau tènement prêt.');
        vibrate(40);
    }

    function resetCurrentCountersAndName() {
        state.alive = 0;
        state.dead = 0;
        state.current.standName = '';
        state.current.durationHours = '';
        state.current.durationMinutes = '';
        els.standName.value = '';
        els.durationHours.value = '';
        els.durationMinutes.value = '';
        els.standName.focus();
    }

    function deleteStand(id) {
        if (!confirm('Supprimer ce tènement du récapitulatif ?')) return;
        state.stands = state.stands.filter((row) => row.id !== id);
        renderAll();
        persist();
        showToast('Tènement supprimé.');
    }

    function clearAllData() {
        const message = 'Effacer toutes les données enregistrées ? Cette action supprimera aussi les compteurs en cours.';
        if (!confirm(message)) return;
        localStorage.removeItem(STORAGE_KEY);
        state.alive = 0;
        state.dead = 0;
        state.stands = [];
        state.checklist = createEmptyChecklist();
        state.current = {
            standName: '',
            inventoryDate: todayISO(),
            standType: 'standard',
            surfaceHa: '',
            initialDensity: '',
            objectiveDensity: 900,
            durationHours: '',
            durationMinutes: ''
        };
        syncFormFromState();
        updateObjectiveField();
        renderAll();
        showToast('Toutes les données ont été effacées.');
    }

    function exportCsv() {
        if (state.stands.length === 0) {
            showToast('Aucun tènement à exporter.');
            return;
        }

        const headers = [
            'N°',
            'Nom du tènement / Référence cadastrale',
            'Type de tènement',
            'Objectif de densité (plants vivants/ha)',
            'Surface (ha)',
            'Comptage statistique',
            'Densité initiale (plants/ha)',
            'Nombre de plants vivants',
            'Nombre de plants morts',
            'Taux d\'arbres vivants',
            'Densité de plants vivants (plants/ha)',
            'Nombre de plants à compter',
            'Nombre de plants comptés',
            'Respect du comptage statistique',
            'Tènement réussi',
            'Durée passée (minutes)'
        ];

        const lines = [headers.join(';')];
        state.stands.forEach((row, index) => {
            lines.push([
                index + 1,
                csvCell(row.name),
                csvCell(row.typeLabel),
                row.objectiveDensity,
                formatDecimal(row.surfaceHa, 2),
                formatPercent(row.samplePercent, 0),
                row.initialDensity,
                row.alive,
                row.dead,
                formatPercent(row.alivePercent, 0),
                row.livingDensity,
                row.plantsToCount,
                row.counted,
                row.countingOk ? 'Oui' : 'Non',
                row.successOk ? 'Oui' : 'Non',
                row.durationTotalMinutes || 0
            ].join(';'));
        });

        const totalAlive = state.stands.reduce((sum, row) => sum + row.alive, 0);
        const totalDead = state.stands.reduce((sum, row) => sum + row.dead, 0);
        const totalCounted = totalAlive + totalDead;
        const totalAlivePercent = totalCounted > 0 ? (totalAlive / totalCounted) * 100 : 0;
        const totalPlantsToCount = state.stands.reduce((sum, row) => sum + row.plantsToCount, 0);
        const totalDurationMinutes = state.stands.reduce((sum, row) => sum + (row.durationTotalMinutes || 0), 0);

        lines.push([
            'TOTAL', '', '', '', '', '', '',
            totalAlive,
            totalDead,
            formatPercent(totalAlivePercent, 0),
            '',
            totalPlantsToCount,
            totalCounted,
            totalCounted >= totalPlantsToCount ? 'Oui' : 'Non',
            state.stands.every((row) => row.successOk) ? 'Oui' : 'Non',
            totalDurationMinutes
        ].join(';'));

        const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventaire_forestier_${todayISO()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Export CSV généré.');
    }

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            for (const legacyKey of LEGACY_STORAGE_KEYS) {
                raw = localStorage.getItem(legacyKey);
                if (raw) break;
            }
        }
        if (!raw) return;
        try {
            const saved = JSON.parse(raw);
            state.alive = Number(saved.alive) || 0;
            state.dead = Number(saved.dead) || 0;
            state.stands = Array.isArray(saved.stands) ? saved.stands : [];
            state.checklist = saved.checklist || {};
            state.current = Object.assign(state.current, saved.current || {});
        } catch (error) {
            console.warn('Impossible de charger les données sauvegardées.', error);
        }
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    }

    function showToast(message) {
        els.toast.textContent = message;
        els.toast.classList.add('visible');
        clearTimeout(showToast.timeout);
        showToast.timeout = setTimeout(() => els.toast.classList.remove('visible'), 2200);
    }

    function setStatusClass(element, ok) {
        element.classList.toggle('ok', Boolean(ok));
        element.classList.toggle('ko', !ok);
    }

    function vibrate(duration) {
        if ('vibrate' in navigator) navigator.vibrate(duration);
    }

    function normalizeDecimalInput(value) {
        return String(value || '').replace(',', '.');
    }

    function normalizeIntegerInput(value) {
        const n = Math.max(0, Math.round(toNumber(value)));
        return n > 0 ? String(n) : '';
    }

    function toNumber(value) {
        const n = Number(String(value || '').replace(',', '.'));
        return Number.isFinite(n) ? n : 0;
    }

    function formatInteger(value) {
        return Math.round(Number(value) || 0).toLocaleString('fr-FR');
    }

    function formatDecimal(value, digits) {
        return (Number(value) || 0).toLocaleString('fr-FR', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        });
    }

    function formatDuration(totalMinutes) {
        const minutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h} h ${String(m).padStart(2, '0')}`;
    }

    function formatPercent(value, digits = 1) {
        return `${(Number(value) || 0).toLocaleString('fr-FR', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        })} %`;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, Number(value) || 0));
    }

    function todayISO() {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 10);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function csvCell(value) {
        const text = String(value ?? '').replace(/"/g, '""');
        return `"${text}"`;
    }
})();
