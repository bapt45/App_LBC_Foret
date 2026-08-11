(function () {
    'use strict';

    const STORAGE_KEY = 'inventaireForestierV214';
    const LEGACY_STORAGE_KEYS = ['inventaireForestierV28', 'inventaireForestierV27', 'inventaireForestierV26', 'inventaireForestierV25', 'inventaireForestierV23', 'inventaireForestierV22', 'inventaireForestierV21', 'inventaireForestierV2'];

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

    const defaultCurrent = () => ({
        standName: '',
        inventoryDate: todayISO(),
        standType: 'standard',
        surfaceHa: '',
        initialDensity: '',
        objectiveDensity: 900,
        durationHours: '',
        durationMinutes: ''
    });

    const createProjectData = () => ({
        alive: 0,
        dead: 0,
        stands: [],
        checklist: createEmptyChecklist(),
        current: defaultCurrent(),
        editingStandId: null
    });

    const appState = {
        projects: [],
        activeProjectId: null
    };

    const $ = (id) => document.getElementById(id);

    const els = {};

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        cacheElements();
        loadState();
        bindEvents();
        renderProjects();
        if (currentProject()) {
            initializeChecklistState(currentProject());
            syncFormFromState();
            updateObjectiveField();
            renderAll();
        }
        registerServiceWorker();
    }

    function cacheElements() {
        Object.assign(els, {
            projectHome: $('projectHome'),
            projectsList: $('projectsList'),
            newProjectName: $('newProjectName'),
            createProject: $('createProject'),
            projectContext: $('projectContext'),
            activeProjectName: $('activeProjectName'),
            backToProjects: $('backToProjects'),
            editNotice: $('editNotice'),
            cancelEdit: $('cancelEdit'),
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
            sumAlive: $('sumAlive'),
            sumDead: $('sumDead'),
            sumPercent: $('sumPercent'),
            sumLivingDensity: $('sumLivingDensity'),
            sumPlantsToCount: $('sumPlantsToCount'),
            sumPlantsCounted: $('sumPlantsCounted'),
            sumCountingStatus: $('sumCountingStatus'),
            sumSuccessStatus: $('sumSuccessStatus'),
            saveStand: $('saveStand'),
            newStand: $('newStand'),
            exportCsv: $('exportCsv'),
            clearAllData: $('clearAllData'),
            toast: $('toast'),
            checklistList: $('checklistList'),
            checklistProgress: $('checklistProgress'),
            exportChecklistCsv: $('exportChecklistCsv'),
            resetChecklist: $('resetChecklist')
        });
    }

    function bindEvents() {
        els.createProject.addEventListener('click', createProjectFromForm);
        els.newProjectName.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') createProjectFromForm();
        });
        els.projectsList.addEventListener('click', (event) => {
            const openButton = event.target.closest('[data-open-project]');
            const deleteButton = event.target.closest('[data-delete-project]');
            if (openButton) openProject(openButton.dataset.openProject);
            if (deleteButton) deleteProject(deleteButton.dataset.deleteProject);
        });
        els.backToProjects.addEventListener('click', () => {
            appState.activeProjectId = null;
            persist();
            renderProjects();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        els.cancelEdit.addEventListener('click', cancelEdit);

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
            [els.standName, els.inventoryDate, els.surfaceHa, els.initialDensity, els.objectiveDensity, els.durationHours, els.durationMinutes].forEach((el) => {
                el.addEventListener(eventName, updateCurrentFromForm);
            });
        });

        els.standType.addEventListener('change', () => {
            updateObjectiveField();
            updateCurrentFromForm();
        });

        els.saveStand.addEventListener('click', saveStand);
        els.newStand.addEventListener('click', newStand);
        els.exportCsv.addEventListener('click', exportCsv);
        els.clearAllData.addEventListener('click', clearProjectData);
        els.manualMinus.addEventListener('click', () => manualAdjust(-1));
        els.manualPlus.addEventListener('click', () => manualAdjust(1));
        els.manualAmount.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') manualAdjust(1);
        });

        els.summaryBody.addEventListener('click', (event) => {
            const editButton = event.target.closest('[data-edit-id]');
            const deleteButton = event.target.closest('[data-delete-id]');
            if (editButton) editStand(editButton.dataset.editId);
            if (deleteButton) deleteStand(deleteButton.dataset.deleteId);
        });

        els.checklistList.addEventListener('change', (event) => {
            const input = event.target.closest('input[type="radio"]');
            if (!input) return;
            const project = currentProject();
            if (!project) return;
            const itemId = input.name.replace('checklist-', '');
            const currentValue = normalizeChecklistItem(project.checklist[itemId]);
            project.checklist[itemId] = {
                answer: input.value,
                comment: currentValue.comment
            };
            project.updatedAt = new Date().toISOString();
            renderChecklist();
            persist();
        });

        els.checklistList.addEventListener('input', (event) => {
            const textarea = event.target.closest('[data-check-comment]');
            if (!textarea) return;
            const project = currentProject();
            if (!project) return;
            const itemId = textarea.dataset.checkComment;
            const currentValue = normalizeChecklistItem(project.checklist[itemId]);
            project.checklist[itemId] = {
                answer: currentValue.answer,
                comment: textarea.value
            };
            project.updatedAt = new Date().toISOString();
            persist();
        });

        els.exportChecklistCsv.addEventListener('click', exportChecklistCsv);
        els.resetChecklist.addEventListener('click', resetChecklist);
    }

    function currentProject() {
        return appState.projects.find((project) => project.id === appState.activeProjectId) || null;
    }

    function createProjectFromForm() {
        const name = els.newProjectName.value.trim();
        if (!name) {
            showToast('Renseigne un nom de projet.');
            els.newProjectName.focus();
            return;
        }
        const project = {
            id: createId(),
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: createProjectData()
        };
        appState.projects.unshift(project);
        appState.activeProjectId = project.id;
        els.newProjectName.value = '';
        initializeChecklistState(project.data);
        syncFormFromState();
        updateObjectiveField();
        persist();
        renderProjects();
        renderAll();
        showToast('Projet créé.');
        els.standName.focus();
    }

    function openProject(projectId) {
        appState.activeProjectId = projectId;
        const project = currentProject();
        if (!project) {
            appState.activeProjectId = null;
            renderProjects();
            return;
        }
        initializeChecklistState(project.data);
        syncFormFromState();
        updateObjectiveField();
        persist();
        renderProjects();
        renderAll();
        switchTab('inventory');
    }

    function deleteProject(projectId) {
        const project = appState.projects.find((item) => item.id === projectId);
        if (!project) return;
        if (!confirm(`Supprimer le projet « ${project.name} » et toutes ses données ?`)) return;
        appState.projects = appState.projects.filter((item) => item.id !== projectId);
        if (appState.activeProjectId === projectId) appState.activeProjectId = null;
        persist();
        renderProjects();
        showToast('Projet supprimé.');
    }

    function renderProjects() {
        const project = currentProject();
        document.body.classList.toggle('project-mode', Boolean(project));
        document.body.classList.toggle('home-mode', !project);
        els.projectContext.hidden = !project;

        if (project) {
            els.activeProjectName.textContent = project.name;
        }

        if (appState.projects.length === 0) {
            els.projectsList.innerHTML = '<div class="empty-state project-empty">Aucun projet pour le moment. Crée un projet pour commencer.</div>';
            return;
        }

        els.projectsList.innerHTML = appState.projects.map((item) => {
            const data = item.data || createProjectData();
            const standsCount = Array.isArray(data.stands) ? data.stands.length : 0;
            const answered = CHECKLIST_ITEMS.filter((check) => Boolean(normalizeChecklistItem((data.checklist || {})[check.id]).answer)).length;
            const updated = item.updatedAt ? formatDateTime(item.updatedAt) : 'Non disponible';
            return `
                <article class="project-card">
                    <div>
                        <h3>${escapeHtml(item.name)}</h3>
                        <p>${standsCount} tènement${standsCount > 1 ? 's' : ''} · Checklist ${answered}/${CHECKLIST_ITEMS.length} · Mis à jour : ${escapeHtml(updated)}</p>
                    </div>
                    <div class="project-card-actions">
                        <button class="project-open-button" type="button" data-open-project="${item.id}">Ouvrir</button>
                        <button class="project-delete-button" type="button" data-delete-project="${item.id}">Supprimer</button>
                    </div>
                </article>
            `;
        }).join('');
    }

    function changeCounter(counter, delta) {
        const project = currentProject();
        if (!project) return;
        const data = project.data;
        if (counter === 'alive') data.alive = Math.max(0, data.alive + delta);
        if (counter === 'dead') data.dead = Math.max(0, data.dead + delta);
        project.updatedAt = new Date().toISOString();
        animateCounter(counter);
        vibrate(18);
        renderAll();
        persist();
    }

    function manualAdjust(direction) {
        const project = currentProject();
        if (!project) return;
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
        const project = currentProject();
        if (!project) return;
        const data = project.data;
        data.current.standName = els.standName.value.trim();
        data.current.inventoryDate = els.inventoryDate.value || todayISO();
        data.current.standType = els.standType.value;
        data.current.surfaceHa = normalizeDecimalInput(els.surfaceHa.value);
        data.current.initialDensity = normalizeDecimalInput(els.initialDensity.value);
        data.current.objectiveDensity = normalizeDecimalInput(els.objectiveDensity.value);
        data.current.durationHours = normalizeIntegerInput(els.durationHours.value);
        data.current.durationMinutes = els.durationMinutes.value === '' ? '' : clamp(Math.round(toNumber(els.durationMinutes.value)), 0, 59).toString();
        project.updatedAt = new Date().toISOString();
        renderAll();
        persist();
    }

    function updateObjectiveField() {
        const project = currentProject();
        if (!project) return;
        const type = TYPES[els.standType.value] || TYPES.standard;
        if (type.objectiveDensity === null) {
            els.objectiveDensity.readOnly = false;
            els.objectiveDensity.placeholder = 'À renseigner';
            if (project.data.current.standType !== 'regionalExemption' && els.standType.value === 'regionalExemption') els.objectiveDensity.value = '';
        } else {
            els.objectiveDensity.readOnly = true;
            els.objectiveDensity.value = type.objectiveDensity;
        }
    }

    function syncFormFromState() {
        const project = currentProject();
        if (!project) return;
        const current = Object.assign(defaultCurrent(), project.data.current || {});
        project.data.current = current;
        els.standName.value = current.standName || '';
        els.inventoryDate.value = current.inventoryDate || todayISO();
        els.standType.value = current.standType || 'standard';
        els.surfaceHa.value = current.surfaceHa || '';
        els.initialDensity.value = current.initialDensity || '';
        els.objectiveDensity.value = current.objectiveDensity || '';
        els.durationHours.value = current.durationHours || '';
        els.durationMinutes.value = current.durationMinutes || '';
    }

    function getCurrentComputed() {
        const project = currentProject();
        const data = project ? project.data : createProjectData();
        const standType = data.current.standType || 'standard';
        const typeConfig = TYPES[standType] || TYPES.standard;
        const surfaceHa = toNumber(data.current.surfaceHa);
        const initialDensity = toNumber(data.current.initialDensity);
        const objectiveDensity = toNumber(data.current.objectiveDensity);
        const durationHours = Math.max(0, Math.round(toNumber(data.current.durationHours)));
        const durationMinutes = clamp(Math.round(toNumber(data.current.durationMinutes)), 0, 59);
        const durationTotalMinutes = durationHours * 60 + durationMinutes;
        const alive = data.alive || 0;
        const dead = data.dead || 0;
        const counted = alive + dead;
        const aliveRate = counted > 0 ? alive / counted : 0;
        const sampleRate = getSampleRate(standType, surfaceHa);
        const plantsToCount = Math.round(surfaceHa * initialDensity * sampleRate);
        const plantsRemaining = Math.max(0, plantsToCount - counted);
        const livingDensity = Math.round(initialDensity * aliveRate);
        const countingOk = counted >= plantsToCount && plantsToCount > 0;
        const successOk = livingDensity >= objectiveDensity && objectiveDensity > 0;

        return {
            id: data.editingStandId || createId(),
            date: data.current.inventoryDate || todayISO(),
            name: data.current.standName,
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
        if (!currentProject()) return;
        renderCounters();
        renderStats();
        renderSummary();
        renderChecklist();
        renderEditMode();
    }

    function renderCounters() {
        const data = currentProject().data;
        els.aliveValue.textContent = formatInteger(data.alive || 0);
        els.deadValue.textContent = formatInteger(data.dead || 0);
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
        const project = currentProject();
        const rows = project.data.stands || [];
        els.summaryBody.innerHTML = '';

        if (rows.length === 0) {
            const tr = document.createElement('tr');
            tr.id = 'emptySummaryRow';
            tr.innerHTML = '<td colspan="16" class="empty-state">Aucun tènement enregistré pour ce projet.</td>';
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
                    <td data-label="Action"><div class="action-cell"><button class="edit-row-button" type="button" data-edit-id="${row.id}" aria-label="Modifier ce tènement">Modifier</button><button class="delete-row-button" type="button" data-delete-id="${row.id}" aria-label="Supprimer ce tènement">×</button></div></td>
                `;
                els.summaryBody.appendChild(tr);
            });
        }
        renderTotals();
    }

    function renderTotals() {
        const rows = currentProject().data.stands || [];
        const totalAlive = rows.reduce((sum, row) => sum + row.alive, 0);
        const totalDead = rows.reduce((sum, row) => sum + row.dead, 0);
        const totalCounted = totalAlive + totalDead;
        const totalAlivePercent = totalCounted > 0 ? (totalAlive / totalCounted) * 100 : 0;
        const totalPlantsToCount = rows.reduce((sum, row) => sum + row.plantsToCount, 0);
        const totalSurface = rows.reduce((sum, row) => sum + row.surfaceHa, 0);
        const weightedLivingPlants = rows.reduce((sum, row) => sum + (row.surfaceHa * row.livingDensity), 0);
        const weightedLivingDensity = totalSurface > 0 ? Math.round(weightedLivingPlants / totalSurface) : 0;
        const countingOk = totalCounted >= totalPlantsToCount && totalPlantsToCount > 0;
        const successOk = rows.length > 0 && rows.every((row) => row.successOk);

        els.sumAlive.textContent = formatInteger(totalAlive);
        els.sumDead.textContent = formatInteger(totalDead);
        els.sumPercent.textContent = formatPercent(totalAlivePercent, 0);
        els.sumLivingDensity.textContent = formatInteger(weightedLivingDensity);
        els.sumPlantsToCount.textContent = formatInteger(totalPlantsToCount);
        els.sumPlantsCounted.textContent = formatInteger(totalCounted);
        els.sumCountingStatus.textContent = countingOk ? '✅' : '❌';
        els.sumSuccessStatus.textContent = successOk ? '✅' : '❌';
    }

    function renderEditMode() {
        const data = currentProject().data;
        const editing = Boolean(data.editingStandId);
        els.editNotice.hidden = !editing;
        els.saveStand.textContent = editing ? '💾 Mettre à jour' : '💾 Enregistrer la saisie';
        els.newStand.textContent = editing ? '✅ Terminer la modification' : '✅ Nouveau tènement';
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
            acc[item.id] = { answer: '', comment: '' };
            return acc;
        }, {});
    }

    function normalizeChecklistItem(value) {
        if (typeof value === 'string') return { answer: value, comment: '' };
        if (value && typeof value === 'object') {
            return { answer: value.answer || '', comment: value.comment || '' };
        }
        return { answer: '', comment: '' };
    }

    function initializeChecklistState(data) {
        const base = createEmptyChecklist();
        const savedChecklist = data.checklist || {};
        CHECKLIST_ITEMS.forEach((item) => {
            base[item.id] = normalizeChecklistItem(savedChecklist[item.id]);
        });
        data.checklist = base;
    }

    function renderChecklist() {
        const project = currentProject();
        if (!project || !els.checklistList) return;
        const data = project.data;
        const answered = CHECKLIST_ITEMS.filter((item) => Boolean(normalizeChecklistItem(data.checklist[item.id]).answer)).length;
        els.checklistProgress.textContent = `${answered} / ${CHECKLIST_ITEMS.length} complété${answered > 1 ? 's' : ''}`;

        els.checklistList.innerHTML = CHECKLIST_ITEMS.map((item, index) => {
            const checklistValue = normalizeChecklistItem(data.checklist[item.id]);
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
                        <div class="check-options" role="radiogroup" aria-label="Réponse pour ${escapeHtml(item.title)}">${optionHtml}</div>
                        <label class="check-comment-label" for="comment-${item.id}">Commentaire</label>
                        <textarea id="comment-${item.id}" class="check-comment" data-check-comment="${item.id}" rows="3" placeholder="Commentaire terrain facultatif...">${escapeHtml(comment)}</textarea>
                    </div>
                </article>
            `;
        }).join('');
    }

    function resetChecklist() {
        const project = currentProject();
        if (!project) return;
        if (!confirm('Réinitialiser toutes les réponses de la checklist de ce projet ?')) return;
        project.data.checklist = createEmptyChecklist();
        project.updatedAt = new Date().toISOString();
        renderChecklist();
        renderProjects();
        persist();
        showToast('Checklist réinitialisée.');
    }

    function exportChecklistCsv() {
        const project = currentProject();
        if (!project) return;
        const data = project.data;
        const headers = ['Projet', 'Date', 'Tènement en cours', 'N°', 'Question', 'Type', 'Réponse', 'Commentaire'];
        const lines = [headers.join(';')];
        CHECKLIST_ITEMS.forEach((item, index) => {
            lines.push([
                csvCell(project.name),
                data.current.inventoryDate || todayISO(),
                csvCell(data.current.standName || ''),
                index + 1,
                csvCell(`${item.title} - ${item.detail}`),
                csvCell(item.type),
                csvCell(formatChecklistAnswer(normalizeChecklistItem(data.checklist[item.id]).answer)),
                csvCell(normalizeChecklistItem(data.checklist[item.id]).comment)
            ].join(';'));
        });
        downloadCsv(lines, `checklist_terrain_${slugify(project.name)}_${todayISO()}.csv`);
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
        const project = currentProject();
        if (!project) return;
        updateCurrentFromForm();
        if (project.data.editingStandId) {
            const row = validateCurrentRow();
            if (!row) return;
            upsertEditingRow(row);
            showToast('Tènement mis à jour.');
        } else {
            showToast('Saisie sauvegardée. Clique sur Nouveau tènement pour l’ajouter au récapitulatif.');
        }
        project.updatedAt = new Date().toISOString();
        renderAll();
        renderProjects();
        persist();
        vibrate(25);
    }

    function newStand() {
        const project = currentProject();
        if (!project) return;
        updateCurrentFromForm();
        const row = validateCurrentRow();
        if (!row) return;

        if (project.data.editingStandId) {
            upsertEditingRow(row);
            resetCurrentCountersAndName();
            showToast('Modification terminée. Nouveau tènement prêt.');
        } else {
            project.data.stands.push(row);
            resetCurrentCountersAndName();
            showToast('Tènement ajouté au récapitulatif. Nouveau tènement prêt.');
        }
        project.updatedAt = new Date().toISOString();
        renderAll();
        renderProjects();
        persist();
        vibrate(40);
    }

    function validateCurrentRow() {
        const row = getCurrentComputed();
        if (!row.name) {
            showToast('Renseigne le nom du tènement.');
            els.standName.focus();
            return null;
        }
        if (row.surfaceHa <= 0) {
            showToast('Renseigne une surface valide.');
            els.surfaceHa.focus();
            return null;
        }
        if (row.initialDensity <= 0) {
            showToast('Renseigne une densité initiale valide.');
            els.initialDensity.focus();
            return null;
        }
        if (row.objectiveDensity <= 0) {
            showToast('Renseigne un objectif de densité valide.');
            els.objectiveDensity.focus();
            return null;
        }
        if (row.counted <= 0) {
            showToast('Compte au moins un plant avant d’enregistrer le tènement.');
            return null;
        }
        return row;
    }

    function upsertEditingRow(row) {
        const data = currentProject().data;
        const index = data.stands.findIndex((item) => item.id === data.editingStandId);
        if (index >= 0) data.stands[index] = Object.assign({}, data.stands[index], row, { id: data.editingStandId });
    }

    function resetCurrentCountersAndName() {
        const data = currentProject().data;
        data.alive = 0;
        data.dead = 0;
        data.editingStandId = null;
        data.current.standName = '';
        data.current.durationHours = '';
        data.current.durationMinutes = '';
        els.standName.value = '';
        els.durationHours.value = '';
        els.durationMinutes.value = '';
        els.standName.focus();
    }

    function editStand(id) {
        const project = currentProject();
        if (!project) return;
        const row = project.data.stands.find((item) => item.id === id);
        if (!row) return;
        project.data.editingStandId = id;
        project.data.alive = row.alive || 0;
        project.data.dead = row.dead || 0;
        project.data.current = {
            standName: row.name || '',
            inventoryDate: row.date || todayISO(),
            standType: row.typeKey || 'standard',
            surfaceHa: String(row.surfaceHa || ''),
            initialDensity: String(row.initialDensity || ''),
            objectiveDensity: String(row.objectiveDensity || ''),
            durationHours: String(row.durationHours || ''),
            durationMinutes: String(row.durationMinutes || '')
        };
        syncFormFromState();
        updateObjectiveField();
        renderAll();
        persist();
        switchTab('inventory');
        showToast('Tènement chargé pour modification.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
        const project = currentProject();
        if (!project) return;
        project.data.editingStandId = null;
        resetCurrentCountersAndName();
        renderAll();
        persist();
        showToast('Modification annulée.');
    }

    function deleteStand(id) {
        const project = currentProject();
        if (!project) return;
        if (!confirm('Supprimer ce tènement du récapitulatif ?')) return;
        project.data.stands = project.data.stands.filter((row) => row.id !== id);
        if (project.data.editingStandId === id) resetCurrentCountersAndName();
        project.updatedAt = new Date().toISOString();
        renderAll();
        renderProjects();
        persist();
        showToast('Tènement supprimé.');
    }

    function clearProjectData() {
        const project = currentProject();
        if (!project) return;
        const message = 'Effacer toutes les données du projet actif ? Les tènements, compteurs en cours et la checklist seront supprimés.';
        if (!confirm(message)) return;
        project.data = createProjectData();
        project.updatedAt = new Date().toISOString();
        initializeChecklistState(project.data);
        syncFormFromState();
        updateObjectiveField();
        renderAll();
        renderProjects();
        persist();
        showToast('Les données du projet ont été effacées.');
    }

    function exportCsv() {
        const project = currentProject();
        if (!project) return;
        const rows = project.data.stands || [];
        if (rows.length === 0) {
            showToast('Aucun tènement à exporter pour ce projet.');
            return;
        }
        const headers = [
            'Projet',
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
        rows.forEach((row, index) => {
            lines.push([
                csvCell(project.name),
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
        const totalAlive = rows.reduce((sum, row) => sum + row.alive, 0);
        const totalDead = rows.reduce((sum, row) => sum + row.dead, 0);
        const totalCounted = totalAlive + totalDead;
        const totalAlivePercent = totalCounted > 0 ? (totalAlive / totalCounted) * 100 : 0;
        const totalPlantsToCount = rows.reduce((sum, row) => sum + row.plantsToCount, 0);
        const totalDurationMinutes = rows.reduce((sum, row) => sum + (row.durationTotalMinutes || 0), 0);
        lines.push([
            csvCell(project.name),
            'TOTAL', '', '', '', '', '', '',
            totalAlive,
            totalDead,
            formatPercent(totalAlivePercent, 0),
            '',
            totalPlantsToCount,
            totalCounted,
            totalCounted >= totalPlantsToCount ? 'Oui' : 'Non',
            rows.every((row) => row.successOk) ? 'Oui' : 'Non',
            totalDurationMinutes
        ].join(';'));
        downloadCsv(lines, `inventaire_forestier_${slugify(project.name)}_${todayISO()}.csv`);
        showToast('Export CSV généré.');
    }

    function downloadCsv(lines, filename) {
        const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }

    function loadState() {
        let raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const saved = JSON.parse(raw);
                appState.projects = Array.isArray(saved.projects) ? saved.projects : [];
                appState.activeProjectId = saved.activeProjectId || null;
                normalizeProjects();
                return;
            } catch (error) {
                console.warn('Impossible de charger les données sauvegardées.', error);
            }
        }

        for (const legacyKey of LEGACY_STORAGE_KEYS) {
            raw = localStorage.getItem(legacyKey);
            if (!raw) continue;
            try {
                const legacy = JSON.parse(raw);
                const project = {
                    id: createId(),
                    name: 'Projet migré',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    data: Object.assign(createProjectData(), {
                        alive: Number(legacy.alive) || 0,
                        dead: Number(legacy.dead) || 0,
                        stands: Array.isArray(legacy.stands) ? legacy.stands : [],
                        checklist: legacy.checklist || {},
                        current: Object.assign(defaultCurrent(), legacy.current || {}),
                        editingStandId: null
                    })
                };
                initializeChecklistState(project.data);
                appState.projects = [project];
                appState.activeProjectId = project.id;
                persist();
                return;
            } catch (error) {
                console.warn('Impossible de migrer les données historiques.', error);
            }
        }
    }

    function normalizeProjects() {
        appState.projects = appState.projects.map((project) => {
            project.data = Object.assign(createProjectData(), project.data || {});
            project.data.current = Object.assign(defaultCurrent(), project.data.current || {});
            project.data.stands = Array.isArray(project.data.stands) ? project.data.stands : [];
            project.data.alive = Number(project.data.alive) || 0;
            project.data.dead = Number(project.data.dead) || 0;
            project.data.editingStandId = project.data.editingStandId || null;
            initializeChecklistState(project.data);
            return project;
        });
        if (!currentProject()) appState.activeProjectId = null;
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
        showToast.timeout = setTimeout(() => els.toast.classList.remove('visible'), 2400);
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

    function formatDateTime(value) {
        try {
            return new Date(value).toLocaleDateString('fr-FR');
        } catch (_) {
            return '';
        }
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

    function createId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function slugify(value) {
        return String(value || 'projet')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase() || 'projet';
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
