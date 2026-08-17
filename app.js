(function () {
    'use strict';

    const STORAGE_KEY = 'inventaireForestierV361';
    const AUTH_SESSION_KEY = 'auditLbcForetCurrentUserV1';
    const LEGACY_STORAGE_KEYS = ['inventaireForestierV360', 'inventaireForestierV340', 'inventaireForestierV330', 'inventaireForestierV320', 'inventaireForestierV310', 'inventaireForestierV300', 'inventaireForestierV214', 'inventaireForestierV28', 'inventaireForestierV27', 'inventaireForestierV26', 'inventaireForestierV25', 'inventaireForestierV23', 'inventaireForestierV22', 'inventaireForestierV21', 'inventaireForestierV2'];

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

    const ROLE_LABELS = {
        admin: 'Administrateur',
        senior: 'Auditeur senior',
        auditor: 'Auditeur',
        reader: 'Lecteur'
    };

    const ROLE_PERMISSIONS = {
        admin: {
            canAccessAdmin: true,
            canEditReferentials: true,
            canEditReportSchema: true,
            canExportPdf: true,
            canAccessFinalSection: true,
            canEditAudit: true,
            canViewOnly: false
        },
        senior: {
            canAccessAdmin: false,
            canEditReferentials: false,
            canEditReportSchema: false,
            canExportPdf: true,
            canAccessFinalSection: true,
            canEditAudit: true,
            canViewOnly: false
        },
        auditor: {
            canAccessAdmin: false,
            canEditReferentials: false,
            canEditReportSchema: false,
            canExportPdf: true,
            canAccessFinalSection: false,
            canEditAudit: true,
            canViewOnly: false
        },
        reader: {
            canAccessAdmin: false,
            canEditReferentials: false,
            canEditReportSchema: false,
            canExportPdf: false,
            canAccessFinalSection: false,
            canEditAudit: false,
            canViewOnly: true
        }
    };


    const MAIN_TAB_DEFINITIONS = [
        { id: 'report', label: '📄 Rapport' },
        { id: 'parcels', label: '🗺️ Parcelles' },
        { id: 'inventory', label: '🌲 Audit terrain' },
        { id: 'checklist', label: '✅ Checklist' },
        { id: 'cobenefits', label: '🌿 Co-bénéfices' }
    ];
    const DEFAULT_MAIN_TAB_ORDER = MAIN_TAB_DEFINITIONS.map((tab) => tab.id);

    let currentUserEmail = '';
    let appEventsBound = false;

    const CHECKLIST_ITEMS = [
        {
                "id": "q01",
                "number": "1",
                "category": "Éligibilité",
                "title": "Mandat",
                "detail": "Courrier attestant que le mandataire ou l’intermédiaire est bien habilité à déposer le projet pour le compte du propriétaire",
                "type": "Le cas échéant"
        },
        {
                "id": "q02",
                "number": "2",
                "category": "Éligibilité",
                "title": "Attestation de propriété",
                "detail": "Matrice cadastrale ou acte notarié ou extrait de logiciel de cadastre, ou document prouvant la maitrise foncière sur une durée au moins égale à celle du projet",
                "type": "Obligatoire"
        },
        {
                "id": "q03",
                "number": "3",
                "category": "Éligibilité",
                "title": "Justificatif de document de gestion durable",
                "detail": "PSG ou CBPS+ : copie de la décision d’agrément du document de gestion par le conseil de centre du CRPF. CBPS : courrier du CRPF notifiant l’adhésion du propriétaire au CBPS. RTG : décision d’agrément du RTG par le conseil de centre du CRPF + adhésion du propriétaire au RTG (signée par le propriétaire et le rédacteur) ou, en son absence, copie du RTG",
                "type": "Obligatoire"
        },
        {
                "id": "q04",
                "number": "4",
                "category": "Éligibilité",
                "title": "Avenant au document de gestion durable",
                "detail": "Avenant au document de gestion durable, au plus tard un an après la date de réception des travaux",
                "type": "Obligatoire"
        },
        {
                "id": "q05",
                "number": "5",
                "category": "Éligibilité",
                "title": "Si absence de document de gestion durable",
                "detail": "Rédaction d’un document de gestion durable dans les 12 mois à compter de la date de réception des travaux",
                "type": "Obligatoire"
        },
        {
                "id": "q06",
                "number": "6",
                "category": "Éligibilité",
                "title": "Si regroupement",
                "detail": "Délibération attestant de l’habilitation du gérant, président, indivisaire… à représenter la structure de regroupement",
                "type": "Le cas échéant"
        },
        {
                "id": "q07",
                "number": "7",
                "category": "Éligibilité",
                "title": "Etat passé de la parcelle",
                "detail": "Orthophotos d’au moins 10 ans et de moins d’un an si possible (avec superposition du fond cadastral si possible) prouvant la nature non boisée des parcelles",
                "type": "Obligatoire"
        },
        {
                "id": "q08",
                "number": "8",
                "category": "Éligibilité",
                "title": "Etat actuel des parcelles",
                "detail": "Photographie aérienne ou satellitaire la plus récente des parcelles",
                "type": "Obligatoire"
        },
        {
                "id": "q09",
                "number": "9",
                "category": "Éligibilité",
                "title": "Photographies in situ",
                "detail": "Photographies actuelles datées et localisées montrant les parcelles après passage de la tempête, de l’incendie ou montrant le dépérissement intense (4 a minima)",
                "type": "Obligatoire"
        },
        {
                "id": "q10",
                "number": "10",
                "category": "Éligibilité",
                "title": "Volume à l’hectare pour une friche en cours de colonisation naturelle",
                "detail": "Démonstration par un professionnel forestier que le volume à l’hectare est négligeable",
                "type": "Le cas échéant"
        },
        {
                "id": "q11",
                "number": "11",
                "category": "Éligibilité",
                "title": "Éléments préservés lors du boisement",
                "detail": "Cartographie et photographies des différents éléments préservés ou valorisés lors du boisement (arbres bocagers, haies, bordures boisées, mare, ripisylve…)",
                "type": "Le cas échéant"
        },
        {
                "id": "q12",
                "number": "12",
                "category": "Éligibilité",
                "title": "Accusé de réception de dépôt d’un document de gestion durable ou décision d’agrément",
                "detail": "Accusé de réception de la part de la délégation régionale du CNPF du document de gestion durable ou de son avenant ou, le cas échéant, copie de la décision d’agrément du document de gestion durable",
                "type": "Le cas échéant"
        },
        {
                "id": "q13",
                "number": "13",
                "category": "Éligibilité",
                "title": "Justification de non régénération après incendie",
                "detail": "Justification du nombre d’années de suivi postincendie et de l’absence de régénération naturelle post-incendie",
                "type": "Le cas échéant"
        },
        {
                "id": "q14",
                "number": "14",
                "category": "Éligibilité",
                "title": "Tempête/neige",
                "detail": "Attestation d’un professionnel forestier",
                "type": "Le cas échéant"
        },
        {
                "id": "q15",
                "number": "15",
                "category": "Éligibilité",
                "title": "Dépérissement intense",
                "detail": "Diagnostic DEPERIS démontrant que le peuplement est très dépérissant Cas d’une crise sanitaire : attestation et 2 documents justificatifs",
                "type": "Le cas échéant"
        },
        {
                "id": "q16",
                "number": "16",
                "category": "Éligibilité",
                "title": "Jeune plantation en échec pour raison climatique",
                "detail": "Démonstration de mortalité pour raison climatique d’une jeune plantation et justification de l’adéquation à la station des essences initiales",
                "type": "Le cas échéant"
        },
        {
                "id": "q17",
                "number": "17",
                "category": "Éligibilité",
                "title": "Diagnostic IBP",
                "detail": "Pour les projets de plus de 2 ha hors crise sanitaire et incendie, diagnostic IBP et justification de son intégration Ou justification des arbres maintenus post-incendie",
                "type": "Le cas échéant"
        },
        {
                "id": "q18",
                "number": "18",
                "category": "Éligibilité",
                "title": "Justification du recours au labour en bandes",
                "detail": "Justification d’un sol à dominante sableuse et avec remontée de nappe en hiver",
                "type": "Le cas échéant"
        },
        {
                "id": "q19",
                "number": "19",
                "category": "Éligibilité",
                "title": "Approbation au cas par cas de la DREAL",
                "detail": "Arrêté préfectoral portant décision d’examen au cas par cas en application de l’article R. 122-3 du Code de l’environnement",
                "type": "Obligatoire"
        },
        {
                "id": "q20",
                "number": "20",
                "category": "Éligibilité",
                "title": "Diagnostic stationnel et climatique et justification des classes de fertilité",
                "detail": "Attestation signée par un professionnel justifiant l’adaptation des essences à la station et au climat futur et le choix des classes de fertilité",
                "type": "Obligatoire"
        },
        {
                "id": "q21",
                "number": "21",
                "category": "Éligibilité",
                "title": "Tables de production",
                "detail": "Copie des tables de production retenues (non nécessaires pour les tables ONF)",
                "type": "Obligatoire"
        },
        {
                "id": "q22",
                "number": "22",
                "category": "Éligibilité",
                "title": "Approbation au cas par cas de l'autorité environnementale",
                "detail": "Arrêté préfectoral portant décision de dispense ou de soumission à étude d’impact environnemental après examen au cas par cas en application de l’article R.122-3 du Code de l’environnement",
                "type": "Obligatoire"
        },
        {
                "id": "q23",
                "number": "23",
                "category": "Éligibilité",
                "title": "Co-bénéfices",
                "detail": "Tableur des co-bénéfices",
                "type": "Obligatoire"
        },
        {
                "id": "q24",
                "number": "24",
                "category": "Éligibilité",
                "title": "Risque d’incendie",
                "detail": "Copie des pages du PDPFCI ou PRDFCI (ou autres documents) si existant",
                "type": "Le cas échéant"
        },
        {
                "id": "q25",
                "number": "25",
                "category": "Éligibilité",
                "title": "Calcul des REA",
                "detail": "Calculateur",
                "type": "Obligatoire"
        },
        {
                "id": "q26",
                "number": "26",
                "category": "Éligibilité",
                "title": "Engagements signés",
                "detail": "Formulaire daté et signé",
                "type": "Obligatoire"
        },
        {
                "id": "q27",
                "number": "27",
                "category": "Éligibilité",
                "title": "Habilitation à signer",
                "detail": "Pour une indivision, pouvoir signé de tous les indivisaires Pour une société civile, Kbis",
                "type": "Le cas échéant"
        },
        {
                "id": "q28",
                "number": "28",
                "category": "Éligibilité",
                "title": "Projet dans un DROM sans filière bois",
                "detail": "Justification que le projet se situe dans une zone ou un DROM pour lequel il n’y a pas de filière bois et que le projet ne vise pas une récolte de bois",
                "type": "Le cas échéant"
        },
        {
                "id": "q29",
                "number": "29",
                "category": "Éligibilité",
                "title": "Autorisation du DSF",
                "detail": "Autorisation du DSF le cas échéant",
                "type": "Le cas échéant"
        },
        {
                "id": "q30",
                "number": "30",
                "category": "Autre vérification documentaire",
                "title": "Rapport de suivi",
                "detail": "Analyse du rapport de suivi fourni par le porteur de projet ou son mandataire",
                "type": "Obligatoire"
        },
        {
                "id": "q31",
                "number": "31",
                "category": "Autre vérification documentaire",
                "title": "Préparation du sol",
                "detail": "Vérification sur facture qu’il n’y a pas eu de labour en plein",
                "type": "Le cas échéant"
        },
        {
                "id": "q32",
                "number": "32",
                "category": "Autre vérification documentaire",
                "title": "Ventilation essences",
                "detail": "- Analyse des factures - Vérification que le changement d’essences ne dépasse pas 20 % de l’ensemble des plants du projet",
                "type": "Obligatoire"
        },
        {
                "id": "q33",
                "number": "33",
                "category": "Autre vérification documentaire",
                "title": "Diversification en essences",
                "detail": "Vérification que les critères de diversification ont été appliqués (par analyse de la facture si un seul tènement)",
                "type": "Obligatoire"
        },
        {
                "id": "q34",
                "number": "34",
                "category": "Autre vérification documentaire",
                "title": "Regarni éventuel",
                "detail": "- Vérification que les essences du regarni sont autorisées par l’arrêté MFR régional - Vérification que les regarnis ont été effectués à l’issue de la 1ère, 2ème ou 3ème saison de végétation",
                "type": "Le cas échéant"
        },
        {
                "id": "q35",
                "number": "35",
                "category": "Autre vérification documentaire",
                "title": "Regarni éventuel",
                "detail": "Vérification que les essences du regarni sont autorisées par l’arrêté MFR régional",
                "type": "Le cas échéant"
        },
        {
                "id": "q36",
                "number": "36",
                "category": "Autre vérification documentaire",
                "title": "Coût des travaux à l'hectare",
                "detail": "Devis",
                "type": "Obligatoire"
        },
        {
                "id": "q37",
                "number": "37",
                "category": "Autre vérification documentaire",
                "title": "Autres travaux éventuels (création de mare, taille de formation…)",
                "detail": "Analyse des factures",
                "type": "Le cas échéant"
        },
        {
                "id": "q38",
                "number": "38",
                "category": "Autre vérification documentaire",
                "title": "Document de gestion durable (DGD)",
                "detail": "Fourniture du courrier d’agrément du DGD par la délégation régionale du CNPF ou de l’aménagement en forêt publique",
                "type": "Obligatoire"
        },
        {
                "id": "q39",
                "number": "39",
                "category": "Autre vérification documentaire",
                "title": "Analyse des aides publiques perçues",
                "detail": "D’après éléments fournis par le porteur de projet",
                "type": "Le cas échéant"
        },
        {
                "id": "q40",
                "number": "40",
                "category": "Autre vérification documentaire",
                "title": "Analyse économique",
                "detail": "Feuille de calcul des VAN",
                "type": "Le cas échéant"
        },
        {
                "id": "q41",
                "number": "41",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « socioéconomique »",
                "detail": "Vérification de la distance d’après facture (ETF ayant réalisé les travaux)",
                "type": "Le cas échéant"
        },
        {
                "id": "q42",
                "number": "42",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « socioéconomique »",
                "detail": "Vérification du recours à des entreprises de réinsertion professionnelle",
                "type": "Le cas échéant"
        },
        {
                "id": "q43",
                "number": "43",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « socioéconomique »",
                "detail": "Vérification de l’adhésion en cours à PEFC (https://www.pefc-france.org/certifications/) ou FSC",
                "type": "Le cas échéant"
        },
        {
                "id": "q44",
                "number": "44",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « socioéconomique »",
                "detail": "Vérification que le propriétaire adhère à une ASLGF ou fait partie d’un GIEEF",
                "type": "Le cas échéant"
        },
        {
                "id": "q45",
                "number": "45",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « socioéconomique »",
                "detail": "Vérification de l’attestation d’assurance contre la tempête ou l’incendie",
                "type": "Le cas échéant"
        },
        {
                "id": "q47",
                "number": "46",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « socioéconomique »",
                "detail": "Les bois éventuellement commercialisés sont valorisés par une entreprise de 1ère transformation située dans un rayon de 50 km autour du chantier de balivage.",
                "type": "Le cas échéant"
        },
        {
                "id": "q48",
                "number": "47",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « socioéconomique »",
                "detail": "Le balivage consiste à diminuer le risque d’incendie à proximité immédiate (moins de 2 km) d’habitations ou de lotissements",
                "type": "Le cas échéant"
        },
        {
                "id": "q49",
                "number": "48",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « sol »",
                "detail": "Vérification du type de préparation du sol (analyse de factures)",
                "type": "Le cas échéant"
        },
        {
                "id": "q50",
                "number": "49",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « sol »",
                "detail": "Vérification d’un document de diagnostic d’humidité du sol avant travail du sol",
                "type": "Le cas échéant"
        },
        {
                "id": "q51",
                "number": "50",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « changement climatique »",
                "detail": "Vérification d’un protocole expérimental",
                "type": "Le cas échéant"
        },
        {
                "id": "q52",
                "number": "51",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « changement climatique »",
                "detail": "Vérification du pourcentage d’essences efficaces dans l’élimination de l’ozone",
                "type": "Le cas échéant"
        },
        {
                "id": "q53",
                "number": "52",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice \"biodiversité\"",
                "detail": "Vérification des proportions d’essences autochtones dans le mélange (analyse de facture)",
                "type": "Le cas échéant"
        },
        {
                "id": "q54",
                "number": "53",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « eau »",
                "detail": "Vérification de la création de mare ou de ripisylve sur facture",
                "type": "Le cas échéant"
        },
        {
                "id": "q55",
                "number": "54",
                "category": "Co-bénéfices",
                "title": "Co-bénéfice « eau »",
                "detail": "Vérification d’un boisement en périmètre de protection rapproché ou éloigné de captage d’eau (uniquement si l’information est publique)",
                "type": "Le cas échéant"
        },
        {
                "id": "q56",
                "number": "55",
                "category": "Audit terrain",
                "title": "Rémanents et souches",
                "detail": "Vérification que les rémanents et souches n’ont pas été exportés",
                "type": "Obligatoire"
        },
        {
                "id": "q57",
                "number": "56",
                "category": "Audit terrain",
                "title": "Préparation du sol",
                "detail": "Si un labour en bandes a été effectué sur moins de 50 % de la surface, vérification que la texture est à dominante sableuse.",
                "type": "Le cas échéant"
        },
        {
                "id": "q58",
                "number": "57",
                "category": "Audit terrain",
                "title": "Arbres isolés, haies, bordures boisées préexistants au projet",
                "detail": "Vérification de leur présence et de l’absence d’éléments (souches…) qui prouveraient une coupe de ces éléments, en s’appuyant sur le document 2E",
                "type": "Le cas échéant"
        },
        {
                "id": "q59",
                "number": "58",
                "category": "Audit terrain",
                "title": "Co-bénéfice « biodiversité » et diversification en essences",
                "detail": "Vérification que les critères de diversification ont été appliqués (par passage dans les différents tènements)",
                "type": "Obligatoire"
        },
        {
                "id": "q60",
                "number": "59",
                "category": "Audit terrain",
                "title": "Maintien d’arbres d’intérêt écologique",
                "detail": "Vérification de leur présence d’après les éléments fournis sur le document 3B ou 4",
                "type": "Le cas échéant"
        },
        {
                "id": "q61",
                "number": "60",
                "category": "Audit terrain",
                "title": "Diagnostic IBP",
                "detail": "Diagnostic IBP à réaliser et vérification que la note de l’IBP n’a pas été dégradée sur le critère A et qu’elle n’a pas baissé de plus de 3 points sur les critères C, D, E et F cumulés",
                "type": "Le cas échéant"
        },
        {
                "id": "q62",
                "number": "61",
                "category": "Audit terrain",
                "title": "Vérification de la station",
                "detail": "Sondage à réaliser, avec relevé de profondeur et de texture et vérification des classes de fertilité choisies par le porteur de projet dans le document 3",
                "type": "Obligatoire"
        },
        {
                "id": "q63",
                "number": "62",
                "category": "Audit terrain",
                "title": "Correction suite à une erreur de diagnostic stationnel ou de fertilité de la part du porteur de projet",
                "detail": "Demande au porteur de projet de refaire les calculs + vérification du calculateur déposé par le porteur de projet",
                "type": "Le cas échéant"
        },
        {
                "id": "q64",
                "number": "63",
                "category": "Audit terrain",
                "title": "Co-bénéfice « sol »",
                "detail": "Vérification du nettoyage ou broyage des rémanents après exploitation de la parcelle",
                "type": "Le cas échéant"
        },
        {
                "id": "q65",
                "number": "64",
                "category": "Audit terrain",
                "title": "Co-bénéfice « biodiversité »",
                "detail": "Vérification que des bordures feuillues ont bien été créées",
                "type": "Le cas échéant"
        },
        {
                "id": "q66",
                "number": "65",
                "category": "Audit terrain",
                "title": "Co-bénéfice « biodiversité »",
                "detail": "Vérification que des arbres d’intérêt écologique ont bien été maintenus",
                "type": "Le cas échéant"
        },
        {
                "id": "q67",
                "number": "66",
                "category": "Audit terrain",
                "title": "Co-bénéfice \"biodiversité\"",
                "detail": "Vérification que des haies ou des arbres isolés ou bocagers ont bien été maintenus",
                "type": "Le cas échéant"
        },
        {
                "id": "q68",
                "number": "67",
                "category": "Audit terrain",
                "title": "Co-bénéfice « biodiversité »",
                "detail": "Vérification du type d’implantation de la diversification (en bandes, par bouquets, pied à pied)",
                "type": "Le cas échéant"
        },
        {
                "id": "q69",
                "number": "68",
                "category": "Audit terrain",
                "title": "Co-bénéfice « biodiversité »",
                "detail": "Vérification du maintien des gros bois et des bois porteurs de micro-habitats",
                "type": "Le cas échéant"
        },
        {
                "id": "q70",
                "number": "69",
                "category": "Audit terrain",
                "title": "Co-bénéfice « eau »",
                "detail": "Vérification que les résineux sont bien implantés à plus de 10 m des bordures de cours d’eau",
                "type": "Le cas échéant"
        },
        {
                "id": "q71",
                "number": "70",
                "category": "Audit terrain",
                "title": "Co-bénéfice « eau »",
                "detail": "Vérification qu’une mare ou une ripisylve a été créée",
                "type": "Le cas échéant"
        }
];

    const CHECKLIST_CATEGORIES = ['Éligibilité', 'Autre vérification documentaire', 'Co-bénéfices', 'Audit terrain'];


    const COBENEFIT_ITEMS = [
        {
                "id": "cb01",
                "number": "1",
                "category": "Socio-économique",
                "title": "Création de plus-value économique territoriale"
        },
        {
                "id": "cb02",
                "number": "2",
                "category": "Socio-économique",
                "title": "Intégration par l’emploi"
        },
        {
                "id": "cb03",
                "number": "3",
                "category": "Socio-économique",
                "title": "Filtration de l’air en zone urbaine"
        },
        {
                "id": "cb04",
                "number": "4",
                "category": "Socio-économique",
                "title": "Certification forestière"
        },
        {
                "id": "cb05",
                "number": "5",
                "category": "Socio-économique",
                "title": "Regroupement de la gestion forestière"
        },
        {
                "id": "cb06",
                "number": "6",
                "category": "Socio-économique",
                "title": "Assurance forestière"
        },
        {
                "id": "cb07",
                "number": "7",
                "category": "Socio-économique",
                "title": "Valorisation locale des bois récoltés"
        },
        {
                "id": "cb08",
                "number": "8",
                "category": "Socio-économique",
                "title": "Prévention du risque d'incendie"
        },
        {
                "id": "cb09",
                "number": "9",
                "category": "Préservation des sols",
                "title": "Diagnostic de l’humidité des sols"
        },
        {
                "id": "cb10",
                "number": "10",
                "category": "Préservation des sols",
                "title": "Préparation du sol"
        },
        {
                "id": "cb11",
                "number": "11",
                "category": "Préservation des sols",
                "title": "Nettoyage du sol avant reboisement"
        },
        {
                "id": "cb12",
                "number": "12",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de moins de 4 ha"
        },
        {
                "id": "cb13",
                "number": "13",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de 4 ha à 25 ha"
        },
        {
                "id": "cb14",
                "number": "14",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de plus de 25 ha"
        },
        {
                "id": "cb15",
                "number": "15",
                "category": "Biodiversité",
                "title": "Mélange intraparcellaire"
        },
        {
                "id": "cb16",
                "number": "16",
                "category": "Biodiversité",
                "title": "Introduction de biodiversité (1/2)"
        },
        {
                "id": "cb17",
                "number": "17",
                "category": "Biodiversité",
                "title": "Introduction de biodiversité (2/2)"
        },
        {
                "id": "cb18",
                "number": "18",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante"
        },
        {
                "id": "cb19",
                "number": "19",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante (1/3)"
        },
        {
                "id": "cb20",
                "number": "20",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante (2/3)"
        },
        {
                "id": "cb21",
                "number": "21",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante (3/3)"
        },
        {
                "id": "cb22",
                "number": "22",
                "category": "Changement climatique",
                "title": "Suivi scientifique"
        },
        {
                "id": "cb23",
                "number": "23",
                "category": "Changement climatique",
                "title": "Lutte contre l’ozone, polluant et gaz à effet de serre (cf. annexe 2)"
        },
        {
                "id": "cb24",
                "number": "24",
                "category": "Eau",
                "title": "Prise en compte de milieux aquatiques ou humides (1/2)"
        },
        {
                "id": "cb25",
                "number": "25",
                "category": "Eau",
                "title": "Prise en compte de milieux aquatiques ou humides (2/2)"
        },
        {
                "id": "cb26",
                "number": "26",
                "category": "Eau",
                "title": "Amélioration de la qualité de l’eau"
        },
        {
                "id": "cb27",
                "number": "27",
                "category": "Eau",
                "title": "Amélioration de la biodiversité liée aux milieux humides"
        }
];




    const DEFAULT_COBENEFIT_RULES = [
        {
                "id": "cbr001",
                "category": "Socio-économique",
                "title": "Création de plus-value économique territoriale",
                "criterion": "La majorité des entreprises de travaux forestiers (ETF) retenues sont situées dans un rayon de 50 km par la route autour du chantier de boisement",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Reboisement||Version 2 du 27/07/2020": "3",
                        "Boisement||Version 3 du 02/09/2025": "3",
                        "Boisement||Version 2 du 27/07/2020": "3",
                        "Balivage||Version 2 du 27/07/2020": "3"
                }
        },
        {
                "id": "cbr002",
                "category": "Socio-économique",
                "title": "Création de plus-value économique territoriale",
                "criterion": "La majorité des entreprises de travaux forestiers (ETF) retenues sont situées dans un rayon entre 50 et 100 km par la route autour du chantier de boisement",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "2",
                        "Reboisement||Version 2 du 27/07/2020": "2",
                        "Boisement||Version 3 du 02/09/2025": "2",
                        "Boisement||Version 2 du 27/07/2020": "2",
                        "Balivage||Version 2 du 27/07/2020": "2"
                }
        },
        {
                "id": "cbr003",
                "category": "Socio-économique",
                "title": "Intégration par l’emploi",
                "criterion": "Une partie des travaux sera réalisée par des entreprises de réinsertion professionnelle ou d’aide à l’emploi de personnes en situation de handicap",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Reboisement||Version 2 du 27/07/2020": "5",
                        "Boisement||Version 3 du 02/09/2025": "5",
                        "Boisement||Version 2 du 27/07/2020": "5",
                        "Balivage||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr004",
                "category": "Socio-économique",
                "title": "Filtration de l’air en zone urbaine",
                "criterion": "Le boisement est localisé sur le territoire d’une métropole ou d’une communauté urbaine ou se situe à moins de 15 km à vol d’oiseau du centre d’une commune de plus de 100 000 habitants",
                "points": {
                        "Boisement||Version 3 du 02/09/2025": "5",
                        "Boisement||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr005",
                "category": "Socio-économique",
                "title": "Filtration de l’air en zone urbaine",
                "criterion": "Le boisement est localisé sur le territoire d’une communauté d’agglomération ou se situe à moins de 15 km à vol d’oiseau du centre d’une commune de plus de 20 000 habitants",
                "points": {
                        "Boisement||Version 3 du 02/09/2025": "2",
                        "Boisement||Version 2 du 27/07/2020": "2"
                }
        },
        {
                "id": "cbr006",
                "category": "Socio-économique",
                "title": "Certification forestière",
                "criterion": "Adhésion à une certification de gestion durable (PEFC, FSC) au plus tard un an après la fin de la plantation",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Reboisement||Version 2 du 27/07/2020": "5",
                        "Boisement||Version 3 du 02/09/2025": "3",
                        "Boisement||Version 2 du 27/07/2020": "5",
                        "Balivage||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr007",
                "category": "Socio-économique",
                "title": "Regroupement de la gestion forestière",
                "criterion": "Le boisement a lieu dans le cadre d’un projet collectif de regroupement de plusieurs propriétaires (ASLGF, GIEEF)",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Reboisement||Version 2 du 27/07/2020": "5",
                        "Boisement||Version 3 du 02/09/2025": "3",
                        "Balivage||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr008",
                "category": "Socio-économique",
                "title": "Assurance forestière",
                "criterion": "Le propriétaire a souscrit une assurance forestière sur les 5 premières années, en particulier en cas d’incendie et tempête, qui couvre une partie des frais de reboisement si la plantation était détruite durant les 5 premières années",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Reboisement||Version 2 du 27/07/2020": "1",
                        "Boisement||Version 3 du 02/09/2025": "3",
                        "Boisement||Version 2 du 27/07/2020": "1"
                }
        },
        {
                "id": "cbr009",
                "category": "Préservation des sols",
                "title": "Diagnostic de l’humidité des sols",
                "criterion": "Diagnostic d’humidité du sol avant travail du sol",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Boisement||Version 3 du 02/09/2025": "3"
                }
        },
        {
                "id": "cbr010",
                "category": "Préservation des sols",
                "title": "Préparation du sol",
                "criterion": "Absence de travail du sol (plantation par potets manuels)",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Reboisement||Version 2 du 27/07/2020": "3",
                        "Boisement||Version 3 du 02/09/2025": "5"
                }
        },
        {
                "id": "cbr011",
                "category": "Préservation des sols",
                "title": "Préparation du sol",
                "criterion": "Préparation du sol par potets mécanisés / Préparation du sol par potets travaillés",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Reboisement||Version 2 du 27/07/2020": "2",
                        "Boisement||Version 3 du 02/09/2025": "3",
                        "Boisement||Version 2 du 27/07/2020": "4"
                }
        },
        {
                "id": "cbr012",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de moins de 4 ha",
                "criterion": "(Re)Boisement en mélange avec 5 essences ou plus, avec au moins 75 % de plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Boisement||Version 3 du 02/09/2025": "5"
                }
        },
        {
                "id": "cbr013",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de moins de 4 ha",
                "criterion": "(Re)Boisement en mélange de 3 essences ou plus, avec au moins 50 % de plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Boisement||Version 3 du 02/09/2025": "3"
                }
        },
        {
                "id": "cbr014",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de moins de 4 ha",
                "criterion": "(Re)Boisement en mélange de 3 essences ou plus, avec au moins 25 % des plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "1",
                        "Boisement||Version 3 du 02/09/2025": "1"
                }
        },
        {
                "id": "cbr015",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de 4 ha à 25 ha",
                "criterion": "(Re)Boisement en mélange de 8 essences ou plus, avec au moins 75 % de plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Boisement||Version 3 du 02/09/2025": "5"
                }
        },
        {
                "id": "cbr016",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de 4 ha à 25 ha",
                "criterion": "(Re)Boisement en mélange de 6 essences ou plus, avec au moins 50 % des plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Boisement||Version 3 du 02/09/2025": "3"
                }
        },
        {
                "id": "cbr017",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de 4 ha à 25 ha",
                "criterion": "(Re)Boisement en mélange de 4 essences ou plus, avec au moins 25 % des plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "1",
                        "Boisement||Version 3 du 02/09/2025": "1"
                }
        },
        {
                "id": "cbr018",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de plus de 25 ha",
                "criterion": "(Re)Boisement en mélange avec 12 essences ou plus, avec au moins 75 % de plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Boisement||Version 3 du 02/09/2025": "5"
                }
        },
        {
                "id": "cbr019",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de plus de 25 ha",
                "criterion": "(Re)Boisement en mélange de 8 essences ou plus, avec au moins 50 % de plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Boisement||Version 3 du 02/09/2025": "3"
                }
        },
        {
                "id": "cbr020",
                "category": "Biodiversité",
                "title": "Mélange et autochtonie pour les projets de plus de 25 ha",
                "criterion": "(Re)Boisement en mélange de 5 essences ou plus, avec au moins 25 % des plants d’essences autochtones adaptées au climat futur",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "1",
                        "Boisement||Version 3 du 02/09/2025": "1"
                }
        },
        {
                "id": "cbr021",
                "category": "Biodiversité",
                "title": "Mélange intraparcellaire",
                "criterion": "Mélange intraparcellaire pied à pied",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Boisement||Version 3 du 02/09/2025": "5"
                }
        },
        {
                "id": "cbr022",
                "category": "Biodiversité",
                "title": "Mélange intraparcellaire",
                "criterion": "Mélange intraparcellaire avec des bouquets de moins de 25 ares au sein du (re)boisement",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Boisement||Version 3 du 02/09/2025": "4"
                }
        },
        {
                "id": "cbr023",
                "category": "Biodiversité",
                "title": "Mélange intraparcellaire",
                "criterion": "Mélange intraparcellaire en bandes au sein du (re)boisement",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "1",
                        "Boisement||Version 3 du 02/09/2025": "1"
                }
        },
        {
                "id": "cbr024",
                "category": "Biodiversité",
                "title": "Introduction de biodiversité (2/2)",
                "criterion": "Création de bordures feuillues linéaires (routes, chemins, limites de parcelles)",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "1",
                        "Reboisement||Version 2 du 27/07/2020": "1",
                        "Boisement||Version 3 du 02/09/2025": "1",
                        "Boisement||Version 2 du 27/07/2020": "1"
                }
        },
        {
                "id": "cbr025",
                "category": "Changement climatique",
                "title": "Suivi scientifique",
                "criterion": "Le projet présente une composante qui sera suivie à titre scientifique pour mieux comprendre le changement climatique (arboretum, réseau ESPERENSE, îlot d’avenir, dispositifs d’expérimentation de diversification en gestion…)",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Boisement||Version 3 du 02/09/2025": "5"
                }
        },
        {
                "id": "cbr026",
                "category": "Changement climatique",
                "title": "Lutte contre l’ozone, polluant et gaz à effet de serre (cf. annexe 2)",
                "criterion": "Le boisement associe au moins 80 % de plants efficaces dans l’élimination de l’ozone (voir espèces figurant en annexe 2)",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Boisement||Version 3 du 02/09/2025": "5"
                }
        },
        {
                "id": "cbr027",
                "category": "Eau",
                "title": "Prise en compte de milieux aquatiques ou humides (2/2)",
                "criterion": "Le (re)boisement résineux est effectué à plus de 10 m de la bordure d’un cours d’eau",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "1",
                        "Reboisement||Version 2 du 27/07/2020": "1",
                        "Boisement||Version 3 du 02/09/2025": "1",
                        "Boisement||Version 2 du 27/07/2020": "1"
                }
        },
        {
                "id": "cbr028",
                "category": "Eau",
                "title": "Amélioration de la qualité de l’eau",
                "criterion": "Boisement en périmètre de protection rapproché (PPR) ou éloigné (PPE) de captage d’eau",
                "points": {
                        "Boisement||Version 3 du 02/09/2025": "5",
                        "Boisement||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr029",
                "category": "Eau",
                "title": "Amélioration de la biodiversité liée aux milieux humides",
                "criterion": "Restauration de milieux humides (curage de mardelles, mares, mangroves…) ou création ex-nihilo d’une mare ou mardelle",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Reboisement||Version 2 du 27/07/2020": "5",
                        "Boisement||Version 3 du 02/09/2025": "5",
                        "Boisement||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr030",
                "category": "Préservation des sols",
                "title": "Préparation du sol",
                "criterion": "Préparation du sol en bandes",
                "points": {
                        "Reboisement||Version 2 du 27/07/2020": "1",
                        "Boisement||Version 2 du 27/07/2020": "2"
                }
        },
        {
                "id": "cbr031",
                "category": "Biodiversité",
                "title": "Introduction de biodiversité (1/2)",
                "criterion": "(Re)boisement avec 3 essences (ou plus), dont au moins 2 essences autochtones représentent au moins 40 % des plants",
                "points": {
                        "Reboisement||Version 2 du 27/07/2020": "5",
                        "Boisement||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr032",
                "category": "Biodiversité",
                "title": "Introduction de biodiversité (1/2)",
                "criterion": "(Re)boisement en mélange de 2 essences, avec au moins 10 % des plants avec une essence autochtone",
                "points": {
                        "Reboisement||Version 2 du 27/07/2020": "1",
                        "Boisement||Version 2 du 27/07/2020": "1"
                }
        },
        {
                "id": "cbr033",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante",
                "criterion": "Maintien de bordures boisées présentes à proximité des parcelles à boiser",
                "points": {
                        "Boisement||Version 2 du 27/07/2020": "2"
                }
        },
        {
                "id": "cbr034",
                "category": "Eau",
                "title": "Prise en compte de milieux aquatiques ou humides (1/2)",
                "criterion": "Choix d’essences adaptées aux bordures de milieux aquatiques (ruisseaux, mares, étangs) et zones humides éventuellement présentes (justifier leur adéquation)",
                "points": {
                        "Reboisement||Version 2 du 27/07/2020": "1",
                        "Boisement||Version 2 du 27/07/2020": "1"
                }
        },
        {
                "id": "cbr035",
                "category": "Socio-économique",
                "title": "Valorisation locale des bois récoltés",
                "criterion": "Les bois éventuellement commercialisés sont valorisés par une entreprise de 1ère transformation située dans un rayon de 50 km autour du chantier de balivage.",
                "points": {
                        "Balivage||Version 2 du 27/07/2020": "3"
                }
        },
        {
                "id": "cbr036",
                "category": "Socio-économique",
                "title": "Prévention du risque d’incendie",
                "criterion": "Le balivage consiste à diminuer le risque d’incendie à proximité immédiate (moins de 2 km) d’habitations ou de lotissements",
                "points": {
                        "Balivage||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr037",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante (1/3)",
                "criterion": "Faire un relevé IBP et justifier l’intégration des éléments en découlant dans l’opération de balivage",
                "points": {
                        "Balivage||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr038",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante (2/3)",
                "criterion": "Maintien de toute la diversité d’essences présente avant balivage",
                "points": {
                        "Balivage||Version 2 du 27/07/2020": "3"
                }
        },
        {
                "id": "cbr039",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante (3/3)",
                "criterion": "Maintien des gros bois et des bois porteurs de micro-habitats",
                "points": {
                        "Balivage||Version 2 du 27/07/2020": "3"
                }
        },
        {
                "id": "cbr040",
                "category": "Changement climatique",
                "title": "Lutte contre l’ozone, polluant et gaz à effet de serre (cf. annexe 2)",
                "criterion": "Le boisement associe entre 40 % et 80 % de plants efficaces dans l’élimination de l’ozone (voir espèces figurant en annexe 2)",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "1",
                        "Boisement||Version 3 du 02/09/2025": "1"
                }
        },
        {
                "id": "cbr041",
                "category": "Préservation des sols",
                "title": "Nettoyage du sol avant reboisement",
                "criterion": "Absence de nettoyage ou de broyage des rémanents après exploitation de la parcelle",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Reboisement||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr042",
                "category": "Préservation des sols",
                "title": "Nettoyage du sol avant reboisement",
                "criterion": "Broyage partiel des rémanents impactant moins de 50 % de la surface",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "3",
                        "Reboisement||Version 2 du 27/07/2020": "3"
                }
        },
        {
                "id": "cbr043",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante",
                "criterion": "Si projet inférieur à 2 ha, réalisation d’un relevé IBP et justification de l’intégration des éléments en découlant dans l’opération de reconstitution",
                "points": {
                        "Reboisement||Version 3 du 04/09/2025": "5",
                        "Reboisement||Version 2 du 27/07/2020": "5"
                }
        },
        {
                "id": "cbr044",
                "category": "Socio-économique",
                "title": "Valorisation locale des bois récoltés",
                "criterion": "Les bois récoltés ou vidangés sont valorisés par une entreprise de 1ère transformation située dans un rayon de 50 km du chantier de reconstitution",
                "points": {
                        "Reboisement||Version 2 du 27/07/2020": "3"
                }
        },
        {
                "id": "cbr045",
                "category": "Biodiversité",
                "title": "Préservation de la biodiversité préexistante",
                "criterion": "Maintien d’arbres d’intérêt écologique ou de bordures boisées présentes à l’intérieur ou en limite des parcelles à reboiser",
                "points": {
                        "Reboisement||Version 2 du 27/07/2020": "2"
                }
        }
];

    const defaultReport = () => ({
        base_auditProjectNumber: '',
        base_auditDurationDays: '',
        base_auditStartDate: '',
        base_auditEndDate: '',
        base_organization: 'Control Union Inspections France',
        base_leadAuditor: '',
        base_qualifications: '',
        base_otherAuditors: '',
        base_otherAuditorsList: [],
        reportOverrides: {},
        client_siret: '',
        client_name: '',
        client_address: '',
        client_zip: '',
        client_city: '',
        client_country: 'FRANCE',
        client_contactTitle: '',
        client_contactFirstName: '',
        client_contactLastName: '',
        client_email: '',
        client_contactRole: '',
        client_otherPeople: '',
        client_otherPeopleList: [],
        project_lbcNumber: '',
        project_name: '',
        project_region: '',
        project_requester: '',
        project_verifiedEmissionReduction: '',
        project_notificationDate: '',
        project_fundingRate: '',
        project_zip: '',
        project_city: '',
        project_country: 'FRANCE',
        project_auditType: '',
        project_method: 'Reboisement',
        project_methodVersion: '',
        project_toolVersion: '',
        project_ownerCount: '',
        project_workEndDate: '',
        project_labelDate: '',
        project_surfaceHa: '',
        project_actualWoodedSurfaceHa: '',
        project_potentialEmissionReduction: '',
        project_fertilitySpecies: '',
        project_fertilityClass: '',
        project_fertilityComment: '',
        project_fertilityRows: [],
        conformity_eligibility: '',
        conformity_documentary: '',
        conformity_cobenefits: '',
        conformity_fieldAudit: '',
        conclusion_verifiedReductions: '',
        conclusion_auditorObservations: '',
        conclusion_clientObservations: '',
        conclusion_statement: '',
        conclusion_auditorName: '',
        conclusion_signature: ''
    });

    const REPORT_DIGIT_ONLY_FIELDS = [
        ['base_auditProjectNumber', 6],
        ['client_siret', 14],
        ['client_zip', 5],
        ['project_zip', 5]
    ];

    const REPORT_FIELD_NAMES = Object.keys(defaultReport()).filter((field) => field !== 'reportOverrides');

    const DEFAULT_CONCLUSION_STATEMENT = 'Sur la base de notre évaluation, rien n’a été porté à notre attention pour nous faire croire qu’il y a des erreurs dans les éléments probants.';

    const REPORT_AUDIT_SYNC_FIELDS = [
        ['em_reaForestBeforeProject', 'em_reaForestBeforeAudit'],
        ['em_reaProductsBeforeProject', 'em_reaProductsBeforeAudit'],
        ['em_reiSubBeforeProject', 'em_reiSubBeforeAudit'],
        ['em_reeBeforeProject', 'em_reeBeforeAudit'],
        ['em_discount1Project', 'em_discount1Audit'],
        ['em_discount2Project', 'em_discount2Audit'],
        ['em_discount3Project', 'em_discount3Audit'],
        ['em_discount4Project', 'em_discount4Audit'],
        ['em_discount5Project', 'em_discount5Audit'],
        ['em_reaForestAfterProject', 'em_reaForestAfterAudit'],
        ['em_reaProductsAfterProject', 'em_reaProductsAfterAudit'],
        ['em_reiSubAfterProject', 'em_reiSubAfterAudit'],
        ['em_reeAfterProject', 'em_reeAfterAudit']
    ];

    const REPORT_CONFORMITY_TARGETS = [
        ['Éligibilité', 'conformity_eligibility'],
        ['Autre vérification documentaire', 'conformity_documentary'],
        ['Co-bénéfices', 'conformity_cobenefits'],
        ['Audit terrain', 'conformity_fieldAudit']
    ];

    const REPORT_AUTO_FIELD_NAMES = [
        ...REPORT_AUDIT_SYNC_FIELDS.map(([, auditField]) => auditField),
        'cb_socioAudit',
        'cb_soilAudit',
        'cb_biodiversityAudit',
        'cb_climateAudit',
        'cb_waterAudit',
        'conformity_eligibility',
        'conformity_documentary',
        'conformity_cobenefits',
        'conformity_fieldAudit',
        'conclusion_verifiedReductions',
        'conclusion_socioResult',
        'conclusion_soilResult',
        'conclusion_biodiversityResult',
        'conclusion_climateResult',
        'conclusion_waterResult',
        'conclusion_auditorName',
        'conclusion_statement'
    ];

    const REPORT_MANUAL_OVERRIDABLE_FIELDS = new Set(REPORT_AUDIT_SYNC_FIELDS.map(([, auditField]) => auditField));

    function digitOnly(value, maxLength) {
        return String(value || '').replace(/\D+/g, '').slice(0, Number(maxLength) || undefined);
    }

    function addDaysToIsoDate(isoDate, daysToAdd) {
        const text = String(isoDate || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
        const [year, month, day] = text.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (Number.isNaN(date.getTime())) return '';
        date.setUTCDate(date.getUTCDate() + Math.max(0, Math.round(Number(daysToAdd) || 0)));
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function computeAuditEndDate(startDate, durationDays) {
        const start = String(startDate || '').trim();
        if (!start) return '';
        const duration = Number(normalizeDecimalInput(durationDays));
        if (!Number.isFinite(duration) || duration <= 0) return start;
        return addDaysToIsoDate(start, Math.max(0, Math.ceil(duration) - 1));
    }

    function syncDerivedReportFields(reportData, projectData) {
        if (!reportData || typeof reportData !== 'object') return reportData;

        REPORT_DIGIT_ONLY_FIELDS.forEach(([field, maxLength]) => {
            reportData[field] = digitOnly(reportData[field], maxLength);
        });

        reportData.base_auditEndDate = computeAuditEndDate(reportData.base_auditStartDate, reportData.base_auditDurationDays);

        COBENEFIT_PERCENT_FIELDS.forEach((field) => {
            const fieldEl = reportFieldEl(field);
            // Le champ en cours de saisie est laissé intact : normaliser à chaque
            // frappe effacerait le « N » de « NA » avant la seconde lettre.
            if (fieldEl && fieldEl === document.activeElement) {
                markCobenefitValidity(fieldEl);
                return;
            }
            const sanitized = sanitizePercentageOrNaField(reportData[field]);
            reportData[field] = sanitized;
            if (fieldEl) {
                if (fieldEl.value !== sanitized) fieldEl.value = sanitized;
                markCobenefitValidity(fieldEl);
            }
        });

        const sumReportFields = (fields) => fields.reduce((sum, field) => sum + toNumber(reportData[field]), 0);

        reportData.em_reeBeforeProject = toInputNumberString(
            sumReportFields(['em_reaForestBeforeProject', 'em_reaProductsBeforeProject', 'em_reiSubBeforeProject']),
            2
        );
        reportData.em_reeAfterProject = toInputNumberString(
            sumReportFields(['em_reaForestAfterProject', 'em_reaProductsAfterProject', 'em_reiSubAfterProject']),
            2
        );

        reportData.em_discount2Project = '10';
        reportData.em_discount2Audit = '10';

        REPORT_AUDIT_SYNC_FIELDS.forEach(([projectField, auditField]) => {
            const projectValue = String(reportData[projectField] ?? '').trim();
            const auditValue = String(reportData[auditField] ?? '').trim();
            const overrides = reportData.reportOverrides || {};
            const manuallyOverridden = Boolean(overrides[auditField]) && Boolean(auditValue);

            if (projectValue) {
                if (!manuallyOverridden || !auditValue) {
                    reportData[auditField] = projectValue;
                }
            } else if (!manuallyOverridden) {
                reportData[auditField] = '';
            }
        });

        reportData.em_reeBeforeAudit = toInputNumberString(
            sumReportFields(['em_reaForestBeforeAudit', 'em_reaProductsBeforeAudit', 'em_reiSubBeforeAudit']),
            2
        );
        reportData.em_reeAfterAudit = toInputNumberString(
            sumReportFields(['em_reaForestAfterAudit', 'em_reaProductsAfterAudit', 'em_reiSubAfterAudit']),
            2
        );

        const checklistSource = (projectData && projectData.checklist) ? projectData.checklist : reportData.checklist || {};
        const applicableChecklistItems = getApplicableChecklistItems().filter((item) => String(item.title || '').trim());
        const fallbackChecklistItems = getAdminChecklistItems().filter((item) => String(item.title || '').trim());
        const checklistItems = applicableChecklistItems.length ? applicableChecklistItems : fallbackChecklistItems;
        const counts = REPORT_CONFORMITY_TARGETS.reduce((acc, [, field]) => {
            acc[field] = 0;
            return acc;
        }, {});
        const conformityFieldByCategory = new Map(REPORT_CONFORMITY_TARGETS.map(([category, field]) => [normalizeComparisonKey(category), field]));
        checklistItems.forEach((item) => {
            const stateAnswer = normalizeChecklistItem(checklistSource[item.id]).answer;
            const targetField = conformityFieldByCategory.get(normalizeComparisonKey(item.category));
            if (stateAnswer === 'non' && targetField) counts[targetField] += 1;
        });
        REPORT_CONFORMITY_TARGETS.forEach(([, field]) => {
            const count = counts[field] || 0;
            reportData[field] = count > 0 ? `${count} non-conformité${count > 1 ? 's' : ''}` : 'Conforme';
        });

        const computedCobenefitResults = computeCobenefitAuditResults(projectData || { report: reportData });
        reportData.cb_socioAudit = computedCobenefitResults.socio;
        reportData.cb_soilAudit = computedCobenefitResults.soil;
        reportData.cb_biodiversityAudit = computedCobenefitResults.biodiversity;
        reportData.cb_climateAudit = computedCobenefitResults.climate;
        reportData.cb_waterAudit = computedCobenefitResults.water;

        reportData.conclusion_verifiedReductions = toInputNumberString(reportData.em_reeAfterAudit || reportData.em_reeAfterProject || '', 2);
        reportData.conclusion_socioResult = normalizePercentageOrNaValue(reportData.cb_socioAudit || reportData.cb_socioClient || '');
        reportData.conclusion_soilResult = normalizePercentageOrNaValue(reportData.cb_soilAudit || reportData.cb_soilClient || '');
        reportData.conclusion_biodiversityResult = normalizePercentageOrNaValue(reportData.cb_biodiversityAudit || reportData.cb_biodiversityClient || '');
        reportData.conclusion_climateResult = normalizePercentageOrNaValue(reportData.cb_climateAudit || reportData.cb_climateClient || '');
        reportData.conclusion_waterResult = normalizePercentageOrNaValue(reportData.cb_waterAudit || reportData.cb_waterClient || '');
        reportData.conclusion_auditorName = String(reportData.base_leadAuditor || reportData.conclusion_auditorName || '').trim();
        reportData.conclusion_statement = DEFAULT_CONCLUSION_STATEMENT;
        return reportData;
    }

    function normalizePercentageOrNaValue(value) {
        const text = String(value ?? '').trim();
        if (!text) return '';
        const compact = text.replace(/\s+/g, '').toUpperCase();
        if (compact === 'NA' || compact === 'N/A') return 'NA';
        const normalized = normalizeDecimalInput(text);
        if (!/^[-+]?\d*(?:\.\d+)?$/.test(normalized) || normalized === '' || normalized === '+' || normalized === '-' || normalized === '.') {
            return '';
        }
        const n = Number(normalized);
        return Number.isFinite(n) ? text : '';
    }

    function sanitizePercentageOrNaField(value) {
        return normalizePercentageOrNaValue(value);
    }

    function normalizeComparisonKey(value) {
        return String(value ?? '')
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function formatPercentageOrNa(value, digits = 2) {
        const text = String(value ?? '').trim();
        if (!text) return '';
        const compact = text.replace(/\s+/g, '').toUpperCase();
        if (compact === 'NA' || compact === 'N/A') return 'NA';
        const n = Number(normalizeDecimalInput(text));
        if (!Number.isFinite(n)) return '';
        return `${n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
    }

    function formatPercentageOnly(value, digits = 2) {
        const text = String(value ?? '').trim();
        if (!text) return '';
        const compact = text.replace(/\s+/g, '').toUpperCase();
        if (compact === 'NA' || compact === 'N/A') return 'NA';
        const n = Number(normalizeDecimalInput(text));
        if (!Number.isFinite(n)) return '';
        return `${n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
    }

    function areReportValuesEquivalent(a, b) {
        const left = String(a ?? '').trim();
        const right = String(b ?? '').trim();
        if (!left && !right) return true;
        const leftCompact = left.replace(/\s+/g, '').toUpperCase();
        const rightCompact = right.replace(/\s+/g, '').toUpperCase();
        if ((leftCompact === 'NA' || leftCompact === 'N/A') && (rightCompact === 'NA' || rightCompact === 'N/A')) return true;
        const leftNumeric = Number(normalizeDecimalInput(left));
        const rightNumeric = Number(normalizeDecimalInput(right));
        if (Number.isFinite(leftNumeric) && Number.isFinite(rightNumeric)) return Math.abs(leftNumeric - rightNumeric) < 0.000001;
        return left === right;
    }

    function areNumericStringsEqual(a, b) {
        return areReportValuesEquivalent(a, b);
    }

    function syncReportFieldsToDom(reportData) {
        if (!reportData) return;
        // On parcourt le DOM (et non REPORT_FIELD_NAMES) pour rester symétrique avec
        // la lecture : les champs des tableaux Émissions / Co-bénéfices n'existent pas
        // dans defaultReport() et n'étaient donc jamais réaffichés sans rechargement.
        document.querySelectorAll('[data-report-field]').forEach((el) => {
            if (el === document.activeElement) return;
            const value = reportData[el.dataset.reportField];
            el.value = value === undefined || value === null ? '' : value;
        });
    }

    function reflectDerivedReportFieldsToDom(reportData) {
        if (!reportData) return;
        syncReportFieldsToDom(reportData);

        const fieldPairs = [
            ['em_reaForestBeforeProject', 'em_reaForestBeforeAudit', 'em_reaForestBeforeJustification'],
            ['em_reaProductsBeforeProject', 'em_reaProductsBeforeAudit', 'em_reaProductsBeforeJustification'],
            ['em_reiSubBeforeProject', 'em_reiSubBeforeAudit', 'em_reiSubBeforeJustification'],
            ['em_reeBeforeProject', 'em_reeBeforeAudit', 'em_reeBeforeJustification'],
            ['em_discount1Project', 'em_discount1Audit', 'em_discount1Justification'],
            ['em_discount2Project', 'em_discount2Audit', 'em_discount2Justification'],
            ['em_discount3Project', 'em_discount3Audit', 'em_discount3Justification'],
            ['em_discount4Project', 'em_discount4Audit', 'em_discount4Justification'],
            ['em_discount5Project', 'em_discount5Audit', 'em_discount5Justification'],
            ['em_reaForestAfterProject', 'em_reaForestAfterAudit', 'em_reaForestAfterJustification'],
            ['em_reaProductsAfterProject', 'em_reaProductsAfterAudit', 'em_reaProductsAfterJustification'],
            ['em_reiSubAfterProject', 'em_reiSubAfterAudit', 'em_reiSubAfterJustification'],
            ['em_reeAfterProject', 'em_reeAfterAudit', 'em_reeAfterJustification'],
            ['cb_socioClient', 'cb_socioAudit', 'cb_socioJustification'],
            ['cb_soilClient', 'cb_soilAudit', 'cb_soilJustification'],
            ['cb_biodiversityClient', 'cb_biodiversityAudit', 'cb_biodiversityJustification'],
            ['cb_climateClient', 'cb_climateAudit', 'cb_climateJustification'],
            ['cb_waterClient', 'cb_waterAudit', 'cb_waterJustification']
        ];
        fieldPairs.forEach(([projectField, auditField, justField]) => {
            const projectValue = reportData[projectField];
            const auditValue = reportData[auditField];
            const justValue = reportData[justField];
            const justEl = document.querySelector(`[data-report-field="${justField}"]`);
            if (!justEl) return;
            const differs = !areReportValuesEquivalent(projectValue, auditValue);
            justEl.classList.toggle('needs-justification', differs);
            justEl.title = differs ? 'Écart à justifier' : '';
            justEl.placeholder = differs && !String(justValue || '').trim() ? 'Justification requise' : 'Justification';
        });
    }

    function refreshDerivedReportFields() {
        const project = currentProject();
        if (!project) return;
        project.data.report = normalizeReport(project.data.report || {});
        syncDerivedReportFields(project.data.report, project.data);
        reflectDerivedReportFieldsToDom(project.data.report);
    }

    let initialReportSchemaSnapshot = null;
    let lockedReportSectionsHtml = '';

    const LOCKED_REPORT_SECTION_TITLES = [
        "Synthèse des réductions d'émissions",
        "Synthèse des co-bénéfices",
        'Conclusion'
    ];
    const LOCKED_REPORT_SECTION_KEYS = LOCKED_REPORT_SECTION_TITLES.map((title) => normalizeComparisonKey(title));

    function isLockedReportSectionTitle(title) {
        return LOCKED_REPORT_SECTION_KEYS.includes(normalizeComparisonKey(title));
    }

    function captureLockedReportSectionsFromDom() {
        const form = document.getElementById('reportForm');
        if (!form) return lockedReportSectionsHtml;
        const lockedSections = Array.from(form.querySelectorAll(':scope > .report-section')).filter((section) => {
            const title = (section.querySelector('h3')?.textContent || '').trim();
            return isLockedReportSectionTitle(title);
        });
        if (lockedSections.length) lockedReportSectionsHtml = lockedSections.map((section) => section.outerHTML).join('\n');
        return lockedReportSectionsHtml;
    }

    function getLockedReportSectionsHtml() {
        return lockedReportSectionsHtml || captureLockedReportSectionsFromDom();
    }

    const DEFAULT_COBENEFIT_MAX_POINTS = [
        {
            category: 'Socio-économique',
            maxPoints: {
                'Reboisement||Version 3 du 04/09/2025': '20',
                'Reboisement||Version 2 du 27/07/2020': '22',
                'Boisement||Version 3 du 02/09/2025': '22',
                'Boisement||Version 2 du 27/07/2020': '24',
                'Balivage||Version 2 du 27/07/2020': '27'
            }
        },
        {
            category: 'Préservation des sols',
            maxPoints: {
                'Reboisement||Version 3 du 04/09/2025': '13',
                'Reboisement||Version 2 du 27/07/2020': '8',
                'Boisement||Version 3 du 02/09/2025': '8',
                'Boisement||Version 2 du 27/07/2020': '4',
                'Balivage||Version 2 du 27/07/2020': 'NA'
            }
        },
        {
            category: 'Biodiversité',
            maxPoints: {
                'Reboisement||Version 3 du 04/09/2025': '14',
                'Reboisement||Version 2 du 27/07/2020': '13',
                'Boisement||Version 3 du 02/09/2025': '11',
                'Boisement||Version 2 du 27/07/2020': '8',
                'Balivage||Version 2 du 27/07/2020': '11'
            }
        },
        {
            category: 'Changement climatique',
            maxPoints: {
                'Reboisement||Version 3 du 04/09/2025': '10',
                'Reboisement||Version 2 du 27/07/2020': 'NA',
                'Boisement||Version 3 du 02/09/2025': '10',
                'Boisement||Version 2 du 27/07/2020': 'NA',
                'Balivage||Version 2 du 27/07/2020': 'NA'
            }
        },
        {
            category: 'Eau',
            maxPoints: {
                'Reboisement||Version 3 du 04/09/2025': '6',
                'Reboisement||Version 2 du 27/07/2020': '7',
                'Boisement||Version 3 du 02/09/2025': '11',
                'Boisement||Version 2 du 27/07/2020': '12',
                'Balivage||Version 2 du 27/07/2020': 'NA'
            }
        }
    ];


    function defaultAdminData() {
        const defaultMethods = [
            { method: 'Reboisement', version: 'Version 3 du 04/09/2025', locked: true },
            { method: 'Reboisement', version: 'Version 2 du 27/07/2020', locked: true },
            { method: 'Boisement', version: 'Version 3 du 02/09/2025', locked: true },
            { method: 'Boisement', version: 'Version 2 du 27/07/2020', locked: true },
            { method: 'Balivage', version: 'Version 2 du 27/07/2020', locked: true }
        ];
        const defaultApplicability = defaultMethods.reduce((acc, row) => {
            acc[methodVersionKey(row.method, row.version)] = true;
            return acc;
        }, {});
        return {
            users: [
                { name: 'Baptiste Hardouin', email: 'bhardouin@controlunion.com', password: 'admin', role: 'admin', locked: true, active: true },
                { name: 'Auditeur Test', email: 'auditeur@controlunion.com', password: 'audit', role: 'auditor', locked: true, active: true },
                { name: 'Lecteur Test', email: 'lecteur@controlunion.com', password: 'lecture', role: 'reader', locked: true, active: true }
            ],
            auditors: [
                { name: 'Baptiste Hardouin', email: 'bhardouin@controlunion.com', password: 'admin', role: 'admin', active: true, qualifications: 'Auditeur Label Bas-Carbone Forêt', locked: true },
                { name: 'Auditeur Test', email: 'auditeur@controlunion.com', password: 'audit', role: 'auditor', active: true, qualifications: 'Auditeur', locked: true },
                { name: 'Lecteur Test', email: 'lecteur@controlunion.com', password: 'lecture', role: 'reader', active: true, qualifications: 'Lecteur', locked: true }
            ],
            auditorStatuses: [
                'Auditeur principal',
                'Auditeur',
                'Auditeur en formation',
                'Expert technique',
                'Observateur'
            ],
            civilities: ['M.', 'Mme', 'Mlle'],
            auditTypes: ['Audit initial', 'Audit de suivi', 'Audit de renouvellement', 'Audit complémentaire'],
            methods: defaultMethods,
            species: [
                'Chêne sessile',
                'Chêne pédonculé',
                'Hêtre',
                'Douglas',
                'Pin maritime',
                'Pin sylvestre',
                'Peuplier',
                'Noyer'
            ],
            customLists: [],
            checklistItems: CHECKLIST_ITEMS.map((item) => ({
                id: item.id,
                number: item.number,
                category: item.category,
                title: item.title,
                detail: item.detail,
                type: item.type,
                locked: true,
                applicability: Object.assign({}, defaultApplicability)
            })),
            lbcProjects: [],
            lbcRegistryLastImport: '',
            reportSchema: defaultReportSchema(),
            cobenefitRules: DEFAULT_COBENEFIT_RULES.map((item) => ({
                id: item.id,
                category: item.category,
                title: item.title,
                criterion: item.criterion,
                locked: true,
                points: Object.assign({}, item.points || {})
            })),
            cobenefitMaxPoints: DEFAULT_COBENEFIT_MAX_POINTS.map((item) => ({
                category: item.category,
                locked: true,
                maxPoints: Object.assign({}, item.maxPoints || {})
            })),
            checklistCobenefitMatrix: {},
            tabOrder: DEFAULT_MAIN_TAB_ORDER.slice()
        };
    }

    const ADMIN_LOCK_COUNTS = {
        users: 0,
        auditors: 3,
        auditorStatuses: 5,
        civilities: 3,
        auditTypes: 4,
        methods: 5,
        species: 8,
        checklistItems: CHECKLIST_ITEMS.length,
        cobenefitRules: DEFAULT_COBENEFIT_RULES.length,
        cobenefitMaxPoints: DEFAULT_COBENEFIT_MAX_POINTS.length
    };

    const defaultCurrent = () => ({
        standName: '',
        selectedParcelIds: [],
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
        parcels: [],
        stands: [],
        report: defaultReport(),
        checklist: createEmptyChecklist(),
        cobenefits: createEmptyCobenefits(),
        current: defaultCurrent(),
        editingStandId: null
    });

    const appState = {
        projects: [],
        activeProjectId: null,
        admin: defaultAdminData()
    };

    const $ = (id) => document.getElementById(id);

    const COBENEFIT_PERCENT_FIELDS = [
        'cb_socioClient', 'cb_socioAudit',
        'cb_soilClient', 'cb_soilAudit',
        'cb_biodiversityClient', 'cb_biodiversityAudit',
        'cb_climateClient', 'cb_climateAudit',
        'cb_waterClient', 'cb_waterAudit'
    ];

    const els = {};

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        cacheElements();
        bindTabNavigation();
        loadState();
        bindAuthEvents();
        restoreAuthSession();
        if (!getCurrentUser()) {
            applyAuthVisibility();
            registerServiceWorker();
            return;
        }
        finishAuthenticatedInit();
        registerServiceWorker();
    }

    function finishAuthenticatedInit() {
        applyAuthVisibility();
        applyMainTabOrder();
        try {
            renderReportSchema();
            cacheReportElements();
        } catch (err) {
            console.error('Initialisation du schéma Rapport impossible.', err);
            cacheReportElements();
        }
        if (!appEventsBound) {
            bindEvents();
            appEventsBound = true;
        }
        try {
            if (hasPermission('canAccessAdmin')) renderAdmin();
        } catch (err) {
            console.error('Rendu Admin impossible.', err);
        }
        populateReportControls();
        populateRegistryDatalist();
        renderProjects();
        loadBundledRegistryIfNeeded();
        if (currentProject()) {
            initializeChecklistState(currentProject().data);
            initializeCobenefitsState(currentProject().data);
            syncFormFromState();
            syncReportFormFromState();
            renderReportDynamicLists();
            updateObjectiveField();
            renderAll();
        }
        applyPermissionsToDom();
    }

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function isAuditorAccountActive(row) {
        return !row || row.active !== false;
    }

    function auditorAccountToUser(row) {
        if (!row || typeof row !== 'object') return null;
        const email = normalizeEmail(row.email);
        if (!email || !String(row.password || '').trim() || !isAuditorAccountActive(row)) return null;
        const role = ROLE_LABELS[row.role] ? row.role : 'auditor';
        return {
            name: String(row.name || email).trim(),
            email,
            password: String(row.password || '').trim(),
            role,
            active: true,
            locked: Boolean(row.locked)
        };
    }

    function getActiveAuditors() {
        ensureAdminDataShape();
        return (appState.admin.auditors || []).filter((auditor) => isAuditorAccountActive(auditor));
    }

    function getAdminUsers() {
        ensureAdminDataShape();
        const byEmail = new Map();
        (appState.admin.auditors || []).forEach((auditor) => {
            const user = auditorAccountToUser(auditor);
            if (user) byEmail.set(user.email, user);
        });
        (appState.admin.users || []).forEach((user) => {
            const email = normalizeEmail(user && user.email);
            if (!email || byEmail.has(email) || user.active === false) return;
            if (!String(user.password || '').trim()) return;
            byEmail.set(email, {
                name: String(user.name || email).trim(),
                email,
                password: String(user.password || '').trim(),
                role: ROLE_LABELS[user.role] ? user.role : 'auditor',
                active: true,
                locked: Boolean(user.locked)
            });
        });
        return Array.from(byEmail.values());
    }

    function getCurrentUser() {
        const email = normalizeEmail(currentUserEmail);
        if (!email) return null;
        return getAdminUsers().find((user) => normalizeEmail(user.email) === email) || null;
    }

    function getCurrentPermissions() {
        const user = getCurrentUser();
        if (!user) return ROLE_PERMISSIONS.reader;
        return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.auditor;
    }

    function hasPermission(permissionName) {
        return Boolean(getCurrentPermissions()[permissionName]);
    }

    function restoreAuthSession() {
        currentUserEmail = normalizeEmail(localStorage.getItem(AUTH_SESSION_KEY) || '');
        if (!getCurrentUser()) {
            currentUserEmail = '';
            localStorage.removeItem(AUTH_SESSION_KEY);
        }
    }

    function bindAuthEvents() {
        if (els.loginSubmit && els.loginSubmit.dataset.bound !== '1') {
            els.loginSubmit.dataset.bound = '1';
            els.loginSubmit.addEventListener('click', handleLoginSubmit);
        }
        [els.loginEmail, els.loginPassword].forEach((input) => {
            if (!input || input.dataset.bound === '1') return;
            input.dataset.bound = '1';
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') handleLoginSubmit();
            });
        });
        if (els.logoutButton && els.logoutButton.dataset.bound !== '1') {
            els.logoutButton.dataset.bound = '1';
            els.logoutButton.addEventListener('click', logoutCurrentUser);
        }
    }

    function handleLoginSubmit() {
        const email = normalizeEmail(els.loginEmail ? els.loginEmail.value : '');
        const password = String(els.loginPassword ? els.loginPassword.value : '');
        const user = getAdminUsers().find((candidate) => normalizeEmail(candidate.email) === email);
        if (!user || String(user.password || '') !== password) {
            if (els.loginError) {
                els.loginError.textContent = 'Email ou mot de passe incorrect, ou compte désactivé.';
                els.loginError.hidden = false;
            }
            return;
        }
        currentUserEmail = normalizeEmail(user.email);
        localStorage.setItem(AUTH_SESSION_KEY, currentUserEmail);
        if (els.loginError) els.loginError.hidden = true;
        if (els.loginPassword) els.loginPassword.value = '';
        finishAuthenticatedInit();
        showToast(`Connecté : ${user.name || user.email}`);
    }

    function logoutCurrentUser() {
        currentUserEmail = '';
        localStorage.removeItem(AUTH_SESSION_KEY);
        const sidepanel = $('adminSidepanel');
        if (sidepanel) sidepanel.classList.remove('open');
        applyAuthVisibility();
        if (els.loginEmail) els.loginEmail.focus();
    }

    function applyAuthVisibility() {
        const user = getCurrentUser();
        const authenticated = Boolean(user);
        document.body.classList.toggle('auth-unlocked', authenticated);
        document.body.classList.toggle('auth-locked', !authenticated);
        document.body.classList.toggle('role-readonly', authenticated && !hasPermission('canEditAudit'));
        if (els.currentUserBadge) {
            els.currentUserBadge.hidden = !authenticated;
            els.currentUserBadge.textContent = authenticated ? `${user.name || user.email} · ${ROLE_LABELS[user.role] || 'Utilisateur'}` : '';
        }
        if (els.logoutButton) els.logoutButton.hidden = !authenticated;
        const adminAllowed = authenticated && hasPermission('canAccessAdmin');
        const openAdmin = $('openAdminPanel');
        if (openAdmin) openAdmin.hidden = !adminAllowed;
        const adminTabButton = document.querySelector('[data-tab="admin"]');
        if (adminTabButton) adminTabButton.style.display = 'none';
        if (els.exportAuditPdf) els.exportAuditPdf.hidden = authenticated && !hasPermission('canExportPdf');
        applyPermissionsToDom();
    }

    function applyPermissionsToDom() {
        const authenticated = Boolean(getCurrentUser());
        if (!authenticated) return;
        const canEdit = hasPermission('canEditAudit');
        const canExport = hasPermission('canExportPdf');
        if (els.exportAuditPdf) els.exportAuditPdf.hidden = !canExport;
        const editableSelector = [
            '#projectHome input', '#projectHome button#createProject',
            '#reportPanel input', '#reportPanel select', '#reportPanel textarea', '#reportPanel button:not(#exportAuditPdf)',
            '#parcelsPanel input', '#parcelsPanel select', '#parcelsPanel textarea', '#parcelsPanel button',
            '#inventoryPanel input', '#inventoryPanel select', '#inventoryPanel textarea', '#inventoryPanel button',
            '#checklistPanel input', '#checklistPanel select', '#checklistPanel textarea', '#checklistPanel button:not(#exportChecklistCsv)',
            '#cobenefitsPanel input', '#cobenefitsPanel select', '#cobenefitsPanel textarea', '#cobenefitsPanel button:not(#exportCobenefitsCsv)'
        ].join(',');
        document.querySelectorAll(editableSelector).forEach((el) => {
            if (el.id === 'backToProjects') return;
            if (el.matches('[data-open-project]')) return;
            el.disabled = !canEdit;
        });
        if (els.exportChecklistCsv) els.exportChecklistCsv.hidden = !canExport;
        if (els.exportCobenefitsCsv) els.exportCobenefitsCsv.hidden = !canExport;
    }

    function bindTabNavigation() {
        document.querySelectorAll('.tab-button').forEach((button) => {
            if (button.dataset.tabBound === '1') return;
            button.dataset.tabBound = '1';
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });
    }

    function cacheElements() {
        Object.assign(els, {
            loginScreen: $('loginScreen'),
            loginEmail: $('loginEmail'),
            loginPassword: $('loginPassword'),
            loginSubmit: $('loginSubmit'),
            loginError: $('loginError'),
            currentUserBadge: $('currentUserBadge'),
            logoutButton: $('logoutButton'),
            projectHome: $('projectHome'),
            projectsList: $('projectsList'),
            newProjectName: $('newProjectName'),
            createProject: $('createProject'),
            projectContext: $('projectContext'),
            activeProjectName: $('activeProjectName'),
            backToProjects: $('backToProjects'),
            reportForm: $('reportForm'),
            reportLeadAuditor: $('reportLeadAuditor'),
            reportLeadQualification: $('reportLeadQualification'),
            otherAuditorsList: $('otherAuditorsList'),
            addOtherAuditor: $('addOtherAuditor'),
            clientContactTitle: $('clientContactTitle'),
            otherPeopleList: $('otherPeopleList'),
            addOtherPerson: $('addOtherPerson'),
            projectAuditType: $('projectAuditType'),
            projectMethod: $('projectMethod'),
            projectMethodVersion: $('projectMethodVersion'),
            lbcProjectName: $('lbcProjectName'),
            lbcProjectsDatalist: $('lbcProjectsDatalist'),
            lbcProjectHint: $('lbcProjectHint'),
            fertilityRows: $('fertilityRows'),
            addFertilityRow: $('addFertilityRow'),
            adminPanel: $('adminPanel'),
            exportAdminCsv: $('exportAdminCsv'),
            importAdminCsv: $('importAdminCsv'),
            importRegistryCsv: $('importRegistryCsv'),
            exportRegistryCsv: $('exportRegistryCsv'),
            clearRegistry: $('clearRegistry'),
            registryProjectCount: $('registryProjectCount'),
            registryLastImport: $('registryLastImport'),
            resetAdminLists: $('resetAdminLists'),
            adminUsersBody: $('adminUsersBody'),
            adminAuditorsBody: $('adminAuditorsBody'),
            adminStatusesBody: $('adminStatusesBody'),
            adminCivilitiesBody: $('adminCivilitiesBody'),
            adminAuditTypesBody: $('adminAuditTypesBody'),
            adminMethodsBody: $('adminMethodsBody'),
            adminSpeciesBody: $('adminSpeciesBody'),
            adminCustomListsBody: $('adminCustomListsBody'),
            adminChecklistHead: $('adminChecklistHead'),
            adminChecklistBody: $('adminChecklistBody'),
            adminChecklistEmpty: $('adminChecklistEmpty'),
            adminCobenefitsHead: $('adminCobenefitsHead'),
            adminCobenefitsBody: $('adminCobenefitsBody'),
            adminCobenefitsEmpty: $('adminCobenefitsEmpty'),
            adminCobenefitMaxHead: $('adminCobenefitMaxHead'),
            adminCobenefitMaxBody: $('adminCobenefitMaxBody'),
            adminCobenefitMaxEmpty: $('adminCobenefitMaxEmpty'),
            adminReportSections: $('adminReportSections'),
            adminReportBlocks: $('adminReportBlocks'),
            adminReportEditTitle: $('adminReportEditTitle'),
            addAdminChecklistItem: $('addAdminChecklistItem'),
            addParcel: $('addParcel'),
            parcelsBody: $('parcelsBody'),
            standParcelsList: $('standParcelsList'),
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
            exportAuditPdf: $('exportAuditPdf'),
            clearAllData: $('clearAllData'),
            toast: $('toast'),
            checklistList: $('checklistList'),
            checklistProgress: $('checklistProgress'),
            exportChecklistCsv: $('exportChecklistCsv'),
            resetChecklist: $('resetChecklist'),
            checklistCategoryNav: $('checklistCategoryNav'),
            cobenefitsList: $('cobenefitsList'),
            cobenefitsProgress: $('cobenefitsProgress'),
            cobenefitCategoryNav: $('cobenefitCategoryNav'),
            exportCobenefitsCsv: $('exportCobenefitsCsv'),
            resetCobenefits: $('resetCobenefits')
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
        if (els.addParcel) els.addParcel.addEventListener('click', addParcelRow);
        if (els.parcelsBody) {
            els.parcelsBody.addEventListener('input', updateParcelsFromDom);
            els.parcelsBody.addEventListener('click', handleParcelTableClick);
        }
        if (els.standParcelsList) {
            els.standParcelsList.addEventListener('change', updateSelectedParcelsFromDom);
        }

        bindTabNavigation();

        // Les champs du rapport sont gérés par délégation afin que le schéma
        // global puisse être re-rendu dynamiquement depuis l'Admin.
        document.querySelectorAll('[data-report-field]').forEach((field) => {});
        if (els.reportForm) {
            els.reportForm.addEventListener('input', (event) => {
                if (event.target.closest('[data-report-field]')) updateReportFromForm(event);
                const reportFieldName = event.target?.dataset?.reportField;
                if (reportFieldName === 'client_zip') refreshPostalCityOptions('client', true);
                if (reportFieldName === 'project_zip') refreshPostalCityOptions('project', true);
                if (event.target.closest('#otherPeopleList')) updateOtherPeopleFromDom();
                if (event.target.closest('#fertilityRows')) updateFertilityRowsFromDom();
            });
            els.reportForm.addEventListener('change', (event) => {
                if (event.target.closest('[data-report-field]')) updateReportFromForm(event);
                const reportFieldName = event.target?.dataset?.reportField;
                if (reportFieldName === 'client_zip') refreshPostalCityOptions('client', true);
                if (reportFieldName === 'project_zip') refreshPostalCityOptions('project', true);
                if (reportFieldName === 'client_city') validatePostalCitySelection('client');
                if (reportFieldName === 'project_city') validatePostalCitySelection('project');
                if (event.target.closest('#otherAuditorsList')) updateOtherAuditorsFromDom();
                if (event.target.closest('#fertilityRows')) updateFertilityRowsFromDom();
                if (event.target.closest('#reportLeadAuditor')) syncLeadAuditorQualification();
                if (event.target.closest('#projectMethod')) {
                    updateMethodVersionOptions(true);
                    renderChecklist();
                    renderCobenefits();
                }
                if (event.target.closest('#projectMethodVersion')) {
                    renderChecklist();
                    renderCobenefits();
                }
                if (event.target.closest('#lbcProjectName')) applySelectedLbcProject();
            });
            els.reportForm.addEventListener('click', (event) => {
                if (event.target.closest('#addOtherAuditor')) addOtherAuditorRow();
                if (event.target.closest('#addOtherPerson')) addOtherPersonRow();
                if (event.target.closest('#addFertilityRow')) addFertilityRow();
                const removeAuditor = event.target.closest('[data-remove-other-auditor]');
                if (removeAuditor) removeOtherAuditorRow(Number(removeAuditor.dataset.removeOtherAuditor));
                const removePerson = event.target.closest('[data-remove-other-person]');
                if (removePerson) removeOtherPersonRow(Number(removePerson.dataset.removeOtherPerson));
                const removeFertility = event.target.closest('[data-remove-fertility-row]');
                if (removeFertility) removeFertilityRow(Number(removeFertility.dataset.removeFertilityRow));
            });
        }

        if (false && els.reportLeadAuditor) {
            els.reportLeadAuditor.addEventListener('change', () => {
                syncLeadAuditorQualification();
                updateReportFromForm();
            });
        }
        if (false && els.projectMethod) {
            els.projectMethod.addEventListener('change', () => {
                updateMethodVersionOptions(true);
                updateReportFromForm();
                renderChecklist();
                renderCobenefits();
            });
        }
        if (false && els.projectMethodVersion) {
            els.projectMethodVersion.addEventListener('change', () => {
                updateReportFromForm();
                renderChecklist();
                renderCobenefits();
            });
        }
        if (false && els.lbcProjectName) {
            els.lbcProjectName.addEventListener('change', () => {
                applySelectedLbcProject();
                updateReportFromForm();
            });
            els.lbcProjectName.addEventListener('input', () => {
                updateReportFromForm();
            });
        }
        if (false && els.addOtherAuditor) els.addOtherAuditor.addEventListener('click', addOtherAuditorRow);
        if (false && els.otherAuditorsList) {
            els.otherAuditorsList.addEventListener('change', updateOtherAuditorsFromDom);
            els.otherAuditorsList.addEventListener('click', (event) => {
                const button = event.target.closest('[data-remove-other-auditor]');
                if (button) removeOtherAuditorRow(Number(button.dataset.removeOtherAuditor));
            });
        }
        if (false && els.addOtherPerson) els.addOtherPerson.addEventListener('click', addOtherPersonRow);
        if (false && els.otherPeopleList) {
            els.otherPeopleList.addEventListener('input', updateOtherPeopleFromDom);
            els.otherPeopleList.addEventListener('click', (event) => {
                const button = event.target.closest('[data-remove-other-person]');
                if (button) removeOtherPersonRow(Number(button.dataset.removeOtherPerson));
            });
        }
        if (false && els.addFertilityRow) els.addFertilityRow.addEventListener('click', addFertilityRow);
        if (false && els.fertilityRows) {
            els.fertilityRows.addEventListener('input', updateFertilityRowsFromDom);
            els.fertilityRows.addEventListener('change', updateFertilityRowsFromDom);
            els.fertilityRows.addEventListener('click', (event) => {
                const button = event.target.closest('[data-remove-fertility-row]');
                if (button) removeFertilityRow(Number(button.dataset.removeFertilityRow));
            });
        }
        if (els.adminPanel) {
            els.adminPanel.addEventListener('input', updateAdminFromDom);
            els.adminPanel.addEventListener('change', updateAdminFromDom);
            els.adminPanel.addEventListener('click', handleAdminClick);
        }
        if (els.adminChecklistBody) {
            els.adminChecklistBody.addEventListener('dragstart', handleChecklistDragStart);
            els.adminChecklistBody.addEventListener('dragover', handleChecklistDragOver);
            els.adminChecklistBody.addEventListener('drop', handleChecklistDrop);
            els.adminChecklistBody.addEventListener('dragend', handleChecklistDragEnd);
        }
        if (els.adminCobenefitsBody) {
            els.adminCobenefitsBody.addEventListener('dragstart', handleCobenefitDragStart);
            els.adminCobenefitsBody.addEventListener('dragover', handleCobenefitDragOver);
            els.adminCobenefitsBody.addEventListener('drop', handleCobenefitDrop);
            els.adminCobenefitsBody.addEventListener('dragend', handleCobenefitDragEnd);
        }
        if (els.adminReportSections) {
            els.adminReportSections.addEventListener('dragstart', handleReportSectionDragStart);
            els.adminReportSections.addEventListener('dragover', handleReportSectionDragOver);
            els.adminReportSections.addEventListener('drop', handleReportSectionDrop);
            els.adminReportSections.addEventListener('dragend', handleReportSchemaDragEnd);
        }
        if (els.adminReportBlocks) {
            els.adminReportBlocks.addEventListener('dragstart', handleReportBlockDragStart);
            els.adminReportBlocks.addEventListener('dragover', handleReportBlockDragOver);
            els.adminReportBlocks.addEventListener('drop', handleReportBlockDrop);
            els.adminReportBlocks.addEventListener('dragend', handleReportSchemaDragEnd);
        }
        if (els.exportAdminCsv) els.exportAdminCsv.addEventListener('click', exportAdminCsv);
        if (els.importAdminCsv) els.importAdminCsv.addEventListener('change', importAdminCsv);
        if (els.importRegistryCsv) els.importRegistryCsv.addEventListener('change', importRegistryCsv);
        if (els.exportRegistryCsv) els.exportRegistryCsv.addEventListener('click', exportRegistryCsv);
        if (els.clearRegistry) els.clearRegistry.addEventListener('click', clearRegistryProjects);
        if (els.resetAdminLists) els.resetAdminLists.addEventListener('click', resetAdminLists);

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
        if (els.exportAuditPdf) els.exportAuditPdf.addEventListener('click', () => {
            if (!hasPermission('canExportPdf')) { showToast('Ton profil ne permet pas l’export PDF.'); return; }
            exportAuditPdf();
        });
        els.clearAllData.addEventListener('click', clearProjectData);

        setupAdminPanel();
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
            const currentValue = normalizeChecklistItem(project.data.checklist[itemId]);
            project.data.checklist[itemId] = {
                answer: input.value,
                comment: currentValue.comment
            };
            project.updatedAt = new Date().toISOString();
            renderChecklist();
            renderCobenefits();
            refreshDerivedReportFields();
            renderProjects();
            persist();
        });

        els.checklistList.addEventListener('input', (event) => {
            const textarea = event.target.closest('[data-check-comment]');
            if (!textarea) return;
            const project = currentProject();
            if (!project) return;
            const itemId = textarea.dataset.checkComment;
            const currentValue = normalizeChecklistItem(project.data.checklist[itemId]);
            project.data.checklist[itemId] = {
                answer: currentValue.answer,
                comment: textarea.value
            };
            project.updatedAt = new Date().toISOString();
            renderChecklist();
            refreshDerivedReportFields();
            renderProjects();
            persist();
        });

        els.exportChecklistCsv.addEventListener('click', exportChecklistCsv);
        els.resetChecklist.addEventListener('click', resetChecklist);

        if (els.checklistCategoryNav) {
            els.checklistCategoryNav.addEventListener('click', (event) => {
                const link = event.target.closest('[data-check-category]');
                if (!link) return;
                const target = document.getElementById(link.dataset.checkCategory);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        if (els.cobenefitsList) {
            els.cobenefitsList.addEventListener('change', handleCobenefitChange);
            els.cobenefitsList.addEventListener('input', handleCobenefitInput);
        }
        if (els.cobenefitCategoryNav) {
            els.cobenefitCategoryNav.addEventListener('click', (event) => {
                const link = event.target.closest('[data-cobenefit-category]');
                if (!link) return;
                const target = document.getElementById(link.dataset.cobenefitCategory);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
        if (els.exportCobenefitsCsv) els.exportCobenefitsCsv.addEventListener('click', exportCobenefitsCsv);
        if (els.resetCobenefits) els.resetCobenefits.addEventListener('click', resetCobenefits);
    }

    function currentProject() {
        return appState.projects.find((project) => project.id === appState.activeProjectId) || null;
    }

    function createProjectFromForm() {
        const selectedName = els.newProjectName.value.trim();
        if (!selectedName) {
            showToast('Sélectionne un projet du registre.');
            els.newProjectName.focus();
            return;
        }
        const registryProject = findRegistryProjectByName(selectedName);
        if (!registryProject) {
            showToast('Le projet choisi doit exister dans le registre importé.');
            els.newProjectName.focus();
            return;
        }
        const project = {
            id: createId(),
            name: registryProject.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: createProjectData()
        };
        const user = getCurrentUser();
        if (user && user.name && getActiveAuditors().some((auditor) => normalizeComparisonKey(auditor.name) === normalizeComparisonKey(user.name))) {
            project.data.report.base_leadAuditor = user.name;
        }
        project.data.report.project_name = registryProject.name;
        project.data.report.project_lbcNumber = registryProject.reference;
        project.data.report.client_name = registryProject.requester;
        project.data.report.project_method = registryProject.method || project.data.report.project_method;
        project.data.report.project_notificationDate = registryProject.notificationDate;
        project.data.report.project_labelDate = registryProject.labelDate;
        project.data.report.project_potentialEmissionReduction = registryProject.potentialRE;
        project.data.report.reportOverrides = {};
        appState.projects.unshift(project);
        appState.activeProjectId = project.id;
        els.newProjectName.value = '';
        initializeChecklistState(project.data);
        initializeCobenefitsState(project.data);
        syncFormFromState();
        syncReportFormFromState();
        refreshDerivedReportFields();
        updateObjectiveField();
        persist();
        renderProjects();
        renderAll();
        showToast('Projet créé à partir du registre.');
        switchTab('report');
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
        initializeCobenefitsState(project.data);
        syncFormFromState();
        syncReportFormFromState();
        refreshDerivedReportFields();
        updateObjectiveField();
        persist();
        renderProjects();
        renderAll();
        switchTab('report');
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
            const parcelsCount = Array.isArray(data.parcels) ? data.parcels.length : 0;
            const answered = getAdminChecklistItems().filter((check) => Boolean(normalizeChecklistItem((data.checklist || {})[check.id]).answer)).length;
            const updated = item.updatedAt ? formatDateTime(item.updatedAt) : 'Non disponible';
            return `
                <article class="project-card">
                    <div>
                        <h3>${escapeHtml(item.name)}</h3>
                        <p>Rapport · ${parcelsCount} parcelle${parcelsCount > 1 ? 's' : ''} · ${standsCount} tènement${standsCount > 1 ? 's' : ''} · Checklist ${answered}/${getAdminChecklistItems().length} · Mis à jour : ${escapeHtml(updated)}</p>
                    </div>
                    <div class="project-card-actions">
                        <button class="project-open-button" type="button" data-open-project="${item.id}">Ouvrir</button>
                        <button class="project-delete-button" type="button" data-delete-project="${item.id}">Supprimer</button>
                    </div>
                </article>
            `;
        }).join('');
    }


    function syncReportFormFromState() {
        const project = currentProject();
        if (!project) return;
        project.data.report = normalizeReport(project.data.report);
        applyReportValueRules(project.data.report);
        syncDerivedReportFields(project.data.report, project.data);
        populateReportControls();
        document.querySelectorAll('[data-report-field]').forEach((field) => {
            const key = field.dataset.reportField;
            field.value = project.data.report[key] ?? '';
        });
        updateMethodVersionOptions(false);
        applyReportValueRules(project.data.report);
        reflectReportConfiguredValuesToDom(project.data.report);
        renderReportDynamicLists();
        reflectDerivedReportFieldsToDom(project.data.report);
    }

    function updateReportFromForm(event) {
        const project = currentProject();
        if (!project) return;
        project.data.report = normalizeReport(project.data.report);
        document.querySelectorAll('[data-report-field]').forEach((field) => {
            project.data.report[field.dataset.reportField] = field.value;
        });
        const changedField = String(event?.target?.dataset?.reportField || '');
        if (changedField && REPORT_MANUAL_OVERRIDABLE_FIELDS.has(changedField)) {
            project.data.report.reportOverrides = project.data.report.reportOverrides || {};
            project.data.report.reportOverrides[changedField] = true;
        }
        applyReportValueRules(project.data.report);
        syncDerivedReportFields(project.data.report, project.data);
        reflectReportConfiguredValuesToDom(project.data.report);
        reflectDerivedReportFieldsToDom(project.data.report);
        project.updatedAt = new Date().toISOString();
        persist();
        renderProjects();
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


    function renderParcels() {
        const project = currentProject();
        if (!project || !els.parcelsBody) return;
        const parcels = project.data.parcels || [];
        els.parcelsBody.innerHTML = '';
        if (parcels.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="3" class="empty-state">Aucune parcelle enregistrée pour ce projet.</td>';
            els.parcelsBody.appendChild(tr);
        } else {
            parcels.forEach((parcel, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td data-label="Nom de la parcelle"><input type="text" value="${escapeHtml(parcel.name || '')}" data-parcel-index="${index}" data-parcel-field="name" placeholder="Ex : A 123" autocomplete="off"></td>
                    <td data-label="Surface (ha)"><input type="number" inputmode="decimal" min="0" step="0.01" value="${escapeHtml(parcel.surfaceHa || '')}" data-parcel-index="${index}" data-parcel-field="surfaceHa" placeholder="Ex : 2,50"></td>
                    <td data-label="Action"><button class="delete-row-button" type="button" data-delete-parcel="${parcel.id}" aria-label="Supprimer cette parcelle">×</button></td>
                `;
                els.parcelsBody.appendChild(tr);
            });
        }
        renderParcelSelector();
    }

    function renderParcelSelector() {
        const project = currentProject();
        if (!project || !els.standParcelsList) return;
        const parcels = (project.data.parcels || []).filter((parcel) => String(parcel.name || '').trim());
        const selected = new Set(project.data.current.selectedParcelIds || []);
        const editingId = project.data.editingStandId;
        const usedByOtherStands = new Set((project.data.stands || [])
            .filter((stand) => stand.id !== editingId)
            .flatMap((stand) => Array.isArray(stand.selectedParcelIds) ? stand.selectedParcelIds : []));
        project.data.current.selectedParcelIds = (project.data.current.selectedParcelIds || []).filter((id) => !usedByOtherStands.has(id));
        selected.clear();
        project.data.current.selectedParcelIds.forEach((id) => selected.add(id));
        els.standParcelsList.innerHTML = '';
        if (parcels.length === 0) {
            const p = document.createElement('p');
            p.className = 'dynamic-empty';
            p.textContent = 'Aucune parcelle disponible. Ajoute d’abord les parcelles dans l’onglet “Liste des parcelles”.';
            els.standParcelsList.appendChild(p);
            return;
        }
        parcels.forEach((parcel) => {
            const label = document.createElement('label');
            label.className = 'parcel-choice';
            const isUsed = usedByOtherStands.has(parcel.id);
            const checked = selected.has(parcel.id) && !isUsed ? 'checked' : '';
            label.classList.toggle('disabled', isUsed);
            label.innerHTML = `
                <input type="checkbox" value="${escapeHtml(parcel.id)}" ${checked} ${isUsed ? 'disabled' : ''}>
                <span class="parcel-choice-name">${escapeHtml(parcel.name)}</span>
                <span class="parcel-choice-surface">${formatDecimal(toNumber(parcel.surfaceHa), 2)} ha${isUsed ? ' · déjà affectée' : ''}</span>
            `;
            els.standParcelsList.appendChild(label);
        });
        syncStandFromSelectedParcels();
    }

    function addParcelRow() {
        const project = currentProject();
        if (!project) return;
        project.data.parcels = Array.isArray(project.data.parcels) ? project.data.parcels : [];
        project.data.parcels.push({ id: createId(), name: '', surfaceHa: '' });
        project.updatedAt = new Date().toISOString();
        renderParcels();
        persist();
        setTimeout(() => {
            const inputs = els.parcelsBody.querySelectorAll('input[data-parcel-field="name"]');
            if (inputs.length) inputs[inputs.length - 1].focus();
        }, 0);
    }

    function updateParcelsFromDom(event) {
        const input = event.target.closest('[data-parcel-index]');
        if (!input) return;
        const project = currentProject();
        if (!project) return;
        const index = Number(input.dataset.parcelIndex);
        const field = input.dataset.parcelField;
        const parcel = project.data.parcels && project.data.parcels[index];
        if (!parcel) return;
        parcel[field] = field === 'surfaceHa' ? normalizeDecimalInput(input.value) : input.value.trim();
        project.updatedAt = new Date().toISOString();
        syncStandFromSelectedParcels();
        renderParcelSelector();
        renderStats();
        renderSummary();
        persist();
    }

    function handleParcelTableClick(event) {
        const button = event.target.closest('[data-delete-parcel]');
        if (!button) return;
        const project = currentProject();
        if (!project) return;
        const id = button.dataset.deleteParcel;
        if (!confirm('Supprimer cette parcelle ? Les tènements déjà enregistrés conserveront leur nom et leur surface, mais cette parcelle ne sera plus sélectionnable.')) return;
        project.data.parcels = (project.data.parcels || []).filter((parcel) => parcel.id !== id);
        project.data.current.selectedParcelIds = (project.data.current.selectedParcelIds || []).filter((parcelId) => parcelId !== id);
        project.updatedAt = new Date().toISOString();
        syncStandFromSelectedParcels();
        renderParcels();
        renderAll();
        persist();
    }

    function updateSelectedParcelsFromDom() {
        const project = currentProject();
        if (!project) return;
        project.data.current.selectedParcelIds = Array.from(els.standParcelsList.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')).map((input) => input.value);
        syncStandFromSelectedParcels();
        updateCurrentFromForm();
    }

    function syncStandFromSelectedParcels() {
        const project = currentProject();
        if (!project) return;
        const selectedIds = project.data.current.selectedParcelIds || [];
        const parcels = project.data.parcels || [];
        const selectedParcels = selectedIds.map((id) => parcels.find((parcel) => parcel.id === id)).filter(Boolean);
        if (selectedParcels.length === 0) {
            if (!project.data.editingStandId) {
                project.data.current.standName = '';
                project.data.current.surfaceHa = '';
            }
        } else {
            project.data.current.standName = selectedParcels.map((parcel) => parcel.name).filter(Boolean).join('; ');
            const surface = selectedParcels.reduce((sum, parcel) => sum + toNumber(parcel.surfaceHa), 0);
            project.data.current.surfaceHa = surface > 0 ? String(Math.round(surface * 10000) / 10000) : '';
        }
        if (els.standName) els.standName.value = project.data.current.standName || '';
        if (els.surfaceHa) els.surfaceHa.value = project.data.current.surfaceHa || '';
    }

    function updateCurrentFromForm() {
        const project = currentProject();
        if (!project) return;
        const data = project.data;

        // V3.9 : on lit d'abord la selection reelle des cases a cocher,
        // puis on regenere le nom et la surface. Cela evite que le bouton
        // "Nouveau tenement" valide une ancienne selection vide.
        data.current.selectedParcelIds = Array.from(els.standParcelsList ? els.standParcelsList.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)') : []).map((input) => input.value);
        syncStandFromSelectedParcels();

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
        renderParcelSelector();
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
            selectedParcelIds: Array.isArray(data.current.selectedParcelIds) ? data.current.selectedParcelIds.slice() : [],
            parcelsLabel: data.current.standName,
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
        renderParcels();
        renderCounters();
        renderStats();
        renderSummary();
        renderChecklist();
        renderCobenefits();
        renderEditMode();
        applyPermissionsToDom();
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

    function computeFieldAuditTotals(rows) {
        const safeRows = Array.isArray(rows) ? rows : [];
        const totalAlive = safeRows.reduce((sum, row) => sum + toNumber(row.alive), 0);
        const totalDead = safeRows.reduce((sum, row) => sum + toNumber(row.dead), 0);
        const totalCounted = totalAlive + totalDead;
        const totalAlivePercent = totalCounted > 0 ? (totalAlive / totalCounted) * 100 : 0;
        const totalPlantsToCount = safeRows.reduce((sum, row) => sum + toNumber(row.plantsToCount), 0);
        const totalPlantsRemaining = Math.max(0, totalPlantsToCount - totalCounted);
        const totalSurface = safeRows.reduce((sum, row) => sum + toNumber(row.surfaceHa), 0);
        const weightedAverage = (field) => {
            if (totalSurface <= 0) return 0;
            const weighted = safeRows.reduce((sum, row) => sum + (toNumber(row.surfaceHa) * toNumber(row[field])), 0);
            return Math.round(weighted / totalSurface);
        };
        return {
            totalAlive,
            totalDead,
            totalCounted,
            totalAlivePercent,
            totalPlantsToCount,
            totalPlantsRemaining,
            totalSurface,
            weightedObjectiveDensity: weightedAverage('objectiveDensity'),
            weightedInitialDensity: weightedAverage('initialDensity'),
            weightedLivingDensity: weightedAverage('livingDensity'),
            countingOk: totalCounted >= totalPlantsToCount && totalPlantsToCount > 0,
            successOk: safeRows.length > 0 && safeRows.every((row) => Boolean(row.successOk))
        };
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
        return getAdminChecklistItems().reduce((acc, item) => {
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
        getAdminChecklistItems().forEach((item) => {
            base[item.id] = normalizeChecklistItem(savedChecklist[item.id]);
        });
        data.checklist = base;
    }

    function renderChecklist() {
        const project = currentProject();
        if (!project || !els.checklistList) return;
        const data = project.data;
        const items = getApplicableChecklistItems();
        const answered = items.filter((item) => Boolean(normalizeChecklistItem(data.checklist[item.id]).answer)).length;
        const alerts = getChecklistCobenefitAlerts(data);
        const alertsByItemId = new Map(alerts.map((alert) => [alert.checklistItem.id, alert]));
        els.checklistProgress.textContent = `${answered} / ${items.length} complété${answered > 1 ? 's' : ''}${alerts.length ? ` · ${alerts.length} alerte${alerts.length > 1 ? 's' : ''}` : ''}`;
        renderChecklistCategoryNav();

        let currentCategory = '';
        els.checklistList.innerHTML = items.map((item, index) => {
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
            const categoryHtml = item.category !== currentCategory
                ? `<div class="check-category" id="check-category-${slugify(item.category)}"><span>${escapeHtml(item.category)}</span></div>`
                : '';
            currentCategory = item.category;

            const alert = alertsByItemId.get(item.id);
            const alertHtml = alert ? `<div class="check-alert">⚠️ Réponse requise : co-bénéfice demandé (${alert.groups.map((group) => escapeHtml(group.title)).join(' ; ')}). Réponds Oui ou Non pour lever l’alerte.</div>` : '';
            return `
                ${categoryHtml}
                <article class="check-item ${value || comment ? 'answered' : ''} ${alert ? 'check-item-alert' : ''}">
                    <div class="check-item-main">
                        <div class="check-item-header">
                            <span class="check-index">${escapeHtml(item.number || String(index + 1))}</span>
                            <span class="check-type ${typeClass}">${escapeHtml(item.type)}</span>
                        </div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.detail)}</p>
                        ${alertHtml}
                    </div>
                    <div class="check-response">
                        <div class="check-options" role="radiogroup" aria-label="Réponse pour ${escapeHtml(item.title)}">${optionHtml}</div>
                        <label class="check-comment-label" for="comment-${item.id}">Commentaire</label>
                        <textarea id="comment-${item.id}" class="check-comment" data-check-comment="${item.id}" rows="3" placeholder="Commentaire facultatif...">${escapeHtml(comment)}</textarea>
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
        const headers = ['Projet', 'Date', 'Tènement en cours', 'Catégorie', 'N°', 'Question', 'Type', 'Réponse', 'Commentaire'];
        const lines = [headers.join(';')];
        getApplicableChecklistItems().forEach((item, index) => {
            lines.push([
                csvCell(project.name),
                data.current.inventoryDate || todayISO(),
                csvCell(data.current.standName || ''),
                csvCell(item.category || ''),
                csvCell(item.number || String(index + 1)),
                csvCell(`${item.title} - ${item.detail}`),
                csvCell(item.type),
                csvCell(formatChecklistAnswer(normalizeChecklistItem(data.checklist[item.id]).answer)),
                csvCell(normalizeChecklistItem(data.checklist[item.id]).comment)
            ].join(';'));
        });
        downloadCsv(lines, `checklist_${slugify(project.name)}_${todayISO()}.csv`);
        showToast('Export checklist CSV généré.');
    }

    function formatChecklistAnswer(value) {
        if (value === 'oui') return 'Oui';
        if (value === 'non') return 'Non';
        if (value === 'na') return 'N/A';
        if (value === 'non_audite') return 'Non audité';
        return 'Non renseigné';
    }


    function cobenefitGroupId(category, title) {
        return slugify(`${category || 'categorie'}-${title || 'cobenefice'}`);
    }

    function getAdminCobenefitRows() {
        ensureAdminDataShape();
        return (appState.admin.cobenefitRules || []).filter((item) => String(item.title || '').trim() && String(item.criterion || '').trim());
    }

    function getApplicableCobenefitGroups() {
        const selectedKey = getSelectedMethodVersionKey();
        const rows = getAdminCobenefitRows();
        const groups = [];
        const map = new Map();
        rows.forEach((row) => {
            const pointValue = row.points && selectedKey && selectedKey !== '||' ? row.points[selectedKey] : '';
            if (selectedKey && selectedKey !== '||' && (pointValue === undefined || pointValue === '')) return;
            const groupId = cobenefitGroupId(row.category, row.title);
            if (!map.has(groupId)) {
                const group = { id: groupId, category: row.category, title: row.title, options: [] };
                map.set(groupId, group);
                groups.push(group);
            }
            map.get(groupId).options.push({
                id: row.id,
                criterion: row.criterion,
                points: selectedKey && selectedKey !== '||' ? String(pointValue || '') : ''
            });
        });
        return groups;
    }

    function normalizeMaxPointsValue(value) {
        const text = String(value ?? '').trim();
        const compact = text.replace(/\s+/g, '').toUpperCase();
        if (!text) return '';
        if (compact === 'NA' || compact === 'N/A') return 'NA';
        const normalized = normalizeDecimalInput(text);
        const n = Number(normalized);
        return Number.isFinite(n) && n >= 0 ? String(n) : '';
    }

    function getCobenefitMaxPoints(category, methodKey) {
        ensureAdminDataShape();
        const row = (appState.admin.cobenefitMaxPoints || []).find((item) => normalizeComparisonKey(item.category) === normalizeComparisonKey(category));
        if (!row || !methodKey || methodKey === '||') return '';
        return normalizeMaxPointsValue(row.maxPoints && row.maxPoints[methodKey]);
    }

    function getCobenefitResultFieldByCategory(category) {
        const key = normalizeComparisonKey(category);
        if (key === normalizeComparisonKey('Socio-économique')) return 'socio';
        if (key === normalizeComparisonKey('Préservation des sols')) return 'soil';
        if (key === normalizeComparisonKey('Biodiversité')) return 'biodiversity';
        if (key === normalizeComparisonKey('Changement climatique')) return 'climate';
        if (key === normalizeComparisonKey('Eau')) return 'water';
        return '';
    }

    function computeCobenefitAuditResults(projectData) {
        const result = { socio: '', soil: '', biodiversity: '', climate: '', water: '' };
        if (!projectData) return result;
        const reportData = projectData.report || {};
        const methodKey = methodVersionKey(reportData.project_method, reportData.project_methodVersion);
        if (!methodKey || methodKey === '||') return result;

        const maxByTarget = {};
        (appState.admin.cobenefitMaxPoints || []).forEach((row) => {
            const target = getCobenefitResultFieldByCategory(row.category);
            if (!target) return;
            const max = normalizeMaxPointsValue(row.maxPoints && row.maxPoints[methodKey]);
            if (!max) {
                result[target] = '';
                return;
            }
            if (max === 'NA') {
                result[target] = 'NA';
                return;
            }
            const maxNumber = Number(max);
            if (Number.isFinite(maxNumber) && maxNumber > 0) {
                maxByTarget[target] = maxNumber;
                result[target] = '0';
            }
        });

        const pointsByTarget = Object.keys(maxByTarget).reduce((acc, key) => {
            acc[key] = 0;
            return acc;
        }, {});
        const state = projectData.cobenefits || {};
        getApplicableCobenefitGroups().forEach((group) => {
            const target = getCobenefitResultFieldByCategory(group.category);
            if (!target || !maxByTarget[target]) return;
            const saved = normalizeCobenefitItem(state[group.id]);
            const selected = group.options.find((option) => option.id === saved.ruleId);
            if (!selected) return;
            const points = Number(normalizeDecimalInput(selected.points));
            if (Number.isFinite(points)) pointsByTarget[target] += points;
        });
        Object.keys(maxByTarget).forEach((target) => {
            result[target] = String(Math.round((pointsByTarget[target] / maxByTarget[target]) * 100));
        });
        return result;
    }

    function createEmptyCobenefits() {
        return getApplicableCobenefitGroups().reduce((acc, group) => {
            acc[group.id] = { ruleId: '', points: '' };
            return acc;
        }, {});
    }

    function normalizeCobenefitItem(value) {
        if (value && typeof value === 'object') {
            return { ruleId: value.ruleId || value.answer || '', points: value.points || '' };
        }
        return { ruleId: '', points: '' };
    }

    function initializeCobenefitsState(data) {
        const saved = data.cobenefits || {};
        const base = {};
        getApplicableCobenefitGroups().forEach((group) => {
            base[group.id] = normalizeCobenefitItem(saved[group.id]);
        });
        data.cobenefits = Object.assign({}, saved, base);
    }

    function renderChecklistCategoryNav() {
        if (!els.checklistCategoryNav) return;
        const categories = [];
        getApplicableChecklistItems().forEach((item) => {
            if (!categories.includes(item.category)) categories.push(item.category);
        });
        els.checklistCategoryNav.innerHTML = categories.map((category) => {
            const id = `check-category-${slugify(category)}`;
            return `<button class="check-category-link" type="button" data-check-category="${id}">${escapeHtml(category)}</button>`;
        }).join('');
    }

    function handleCobenefitChange(event) {
        const input = event.target.closest('select[data-cobenefit-answer]');
        if (!input) return;
        const project = currentProject();
        if (!project) return;
        const groupId = input.dataset.cobenefitAnswer;
        const groups = getApplicableCobenefitGroups();
        const group = groups.find((item) => item.id === groupId);
        const selected = group ? group.options.find((option) => option.id === input.value) : null;
        project.data.cobenefits[groupId] = {
            ruleId: input.value,
            points: selected ? selected.points : ''
        };
        project.updatedAt = new Date().toISOString();
        renderCobenefits();
        renderChecklist();
        refreshDerivedReportFields();
        renderProjects();
        persist();
    }

    function handleCobenefitInput() {
        // Les points sont calculés depuis le référentiel admin et ne sont pas modifiables ici.
    }

    function renderCobenefits() {
        const project = currentProject();
        if (!project || !els.cobenefitsList) return;
        initializeCobenefitsState(project.data);
        const groups = getApplicableCobenefitGroups();
        renderCobenefitCategoryNav(groups);
        if (!groups.length) {
            els.cobenefitsList.innerHTML = '<p class="dynamic-empty">Aucun co-bénéfice applicable pour la méthode et la version sélectionnées.</p>';
            renderCobenefitsProgress();
            return;
        }
        let currentCategory = '';
        els.cobenefitsList.innerHTML = groups.map((group, index) => {
            const value = normalizeCobenefitItem(project.data.cobenefits[group.id]);
            const selected = group.options.find((option) => option.id === value.ruleId);
            const points = selected ? selected.points : '';
            const options = ['<option value="">Non demandé / non renseigné</option>']
                .concat(group.options.map((option) => `<option value="${escapeHtml(option.id)}" ${option.id === value.ruleId ? 'selected' : ''}>${escapeHtml(option.criterion)}${option.points !== '' ? ` — ${escapeHtml(option.points)} pt${Number(option.points) > 1 ? 's' : ''}` : ''}</option>`));
            const categoryHtml = group.category !== currentCategory
                ? `<div class="check-category cobenefit-section-anchor" id="cobenefit-category-${slugify(group.category)}"><span>${escapeHtml(group.category)}</span></div>`
                : '';
            currentCategory = group.category;
            return `
                ${categoryHtml}
                <article class="cobenefit-item check-item ${value.ruleId ? 'answered' : ''}">
                    <div class="cobenefit-main check-item-main">
                        <div class="check-item-header">
                            <span class="check-index cobenefit-index">${escapeHtml(String(index + 1))}</span>
                            <span class="check-type conditional">${escapeHtml(group.category)}</span>
                        </div>
                        <h3>${escapeHtml(group.title)}</h3>
                        <p>${selected ? escapeHtml(selected.criterion) : 'Sélectionne la réponse retenue pour afficher le critère d’évaluation et les points associés.'}</p>
                    </div>
                    <div class="cobenefit-fields check-response">
                        <label>
                            Réponse retenue
                            <select data-cobenefit-answer="${escapeHtml(group.id)}">
                                ${options.join('')}
                            </select>
                        </label>
                        <label>
                            Points
                            <input type="text" readonly value="${escapeHtml(points)}" placeholder="—" aria-label="Points calculés">
                        </label>
                    </div>
                </article>
            `;
        }).join('');
        renderCobenefitsProgress();
    }

    function renderCobenefitCategoryNav(groups) {
        if (!els.cobenefitCategoryNav) return;
        const categories = [];
        (groups || getApplicableCobenefitGroups()).forEach((group) => {
            if (!categories.includes(group.category)) categories.push(group.category);
        });
        els.cobenefitCategoryNav.innerHTML = categories.map((category) => {
            const id = `cobenefit-category-${slugify(category)}`;
            return `<button class="check-category-link" type="button" data-cobenefit-category="${id}">${escapeHtml(category)}</button>`;
        }).join('');
    }

    function renderCobenefitsProgress() {
        const project = currentProject();
        if (!project || !els.cobenefitsProgress) return;
        const groups = getApplicableCobenefitGroups();
        const answered = groups.filter((group) => Boolean(normalizeCobenefitItem(project.data.cobenefits[group.id]).ruleId)).length;
        const totalPoints = groups.reduce((sum, group) => sum + toNumber(normalizeCobenefitItem(project.data.cobenefits[group.id]).points), 0);
        els.cobenefitsProgress.textContent = `${answered} / ${groups.length} complété${answered > 1 ? 's' : ''} · ${formatDecimal(totalPoints, 2)} point${totalPoints > 1 ? 's' : ''}`;
    }

    function resetCobenefits() {
        const project = currentProject();
        if (!project) return;
        if (!confirm('Réinitialiser toutes les réponses de la section Co-bénéfices de ce projet ?')) return;
        project.data.cobenefits = createEmptyCobenefits();
        project.updatedAt = new Date().toISOString();
        renderCobenefits();
        renderProjects();
        persist();
        showToast('Co-bénéfices réinitialisés.');
    }

    function exportCobenefitsCsv() {
        const project = currentProject();
        if (!project) return;
        const headers = ['Projet', 'Catégorie', 'Co-bénéfice', 'Réponse retenue', 'Points'];
        const lines = [headers.join(';')];
        getApplicableCobenefitGroups().forEach((group) => {
            const value = normalizeCobenefitItem(project.data.cobenefits[group.id]);
            const selected = group.options.find((option) => option.id === value.ruleId);
            lines.push([
                csvCell(project.name),
                csvCell(group.category),
                csvCell(group.title),
                csvCell(selected ? selected.criterion : 'Non renseigné'),
                csvCell(selected ? selected.points : '')
            ].join(';'));
        });
        downloadCsv(lines, `cobenefices_${slugify(project.name)}_${todayISO()}.csv`);
        showToast('Export co-bénéfices CSV généré.');
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
            showToast('Sélectionne au moins une parcelle pour composer le tènement.');
            switchTab('parcels');
            return null;
        }
        if (row.surfaceHa <= 0) {
            showToast('La surface calculée doit être supérieure à 0. Vérifie la surface des parcelles.');
            switchTab('parcels');
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
        data.current.selectedParcelIds = [];
        data.current.surfaceHa = '';
        data.current.durationHours = '';
        data.current.durationMinutes = '';
        els.standName.value = '';
        els.surfaceHa.value = '';
        els.durationHours.value = '';
        els.durationMinutes.value = '';
        if (els.standParcelsList) els.standParcelsList.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            selectedParcelIds: Array.isArray(row.selectedParcelIds) ? row.selectedParcelIds.slice() : [],
            inventoryDate: row.date || todayISO(),
            standType: row.typeKey || 'standard',
            surfaceHa: String(row.surfaceHa || ''),
            initialDensity: String(row.initialDensity || ''),
            objectiveDensity: String(row.objectiveDensity || ''),
            durationHours: String(row.durationHours || ''),
            durationMinutes: String(row.durationMinutes || '')
        };
        syncFormFromState();
        syncReportFormFromState();
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
        const message = 'Effacer toutes les données du projet actif ? Le rapport, les parcelles, les tènements, compteurs en cours, la checklist et les co-bénéfices seront supprimés.';
        if (!confirm(message)) return;
        project.data = createProjectData();
        project.updatedAt = new Date().toISOString();
        initializeChecklistState(project.data);
        initializeCobenefitsState(project.data);
        syncFormFromState();
        syncReportFormFromState();
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
            'Tènement / parcelles',
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


    function exportAuditPdf() {
        const project = currentProject();
        if (!project) return;
        updateCurrentFromForm();
        updateReportFromForm();

        // Signature automatique : ne remplace jamais une mention saisie à la main.
        const report = project.data?.report || {};
        if (!String(report.conclusion_signature || '').trim()) {
            const auditorName = report.base_leadAuditor || report.conclusion_auditorName || 'Auditeur';
            const now = new Date();
            const dateStr = now.toLocaleDateString('fr-FR');
            const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            report.conclusion_signature = `${auditorName} — ${dateStr} ${timeStr}`;
            reflectDerivedReportFieldsToDom(report);
        }

        project.updatedAt = new Date().toISOString();
        persist();
        renderProjects();
        renderAll();

        const html = buildAuditPdfHtml(project);
        const pdfFilename = `${buildAuditPdfFilename(report, projectName)}.pdf`;

        if (window.auditLbcDesktop && typeof window.auditLbcDesktop.exportPdf === 'function') {
            window.auditLbcDesktop.exportPdf({ html, filename: pdfFilename })
                .then((result) => {
                    if (result && result.canceled) {
                        showToast('Export PDF annulé.');
                        return;
                    }
                    showToast('PDF exporté.');
                })
                .catch((error) => {
                    console.error(error);
                    showToast('Erreur lors de l’export PDF.');
                });
            return;
        }

        const popup = window.open('', '_blank', 'width=1280,height=900');
        if (!popup) {
            showToast('Autorise les fenêtres pop-up pour exporter le PDF.');
            return;
        }
        popup.document.open();
        popup.document.write(html);
        popup.document.close();
        popup.focus();
    }

    function buildAuditPdfHtml(project) {
        const data = project.data || createProjectData();
        const report = data.report || defaultReport();
        const projectName = report.project_name || project.name || 'Projet';
        const methodLabel = [report.project_method, report.project_methodVersion].filter(Boolean).join(' · ');
        const checklistItems = getApplicableChecklistItems();
        const cobenefitGroups = getApplicableCobenefitGroups();
        const stands = Array.isArray(data.stands) ? data.stands : [];
        const logoUrl = new URL('assets/cu-logo-fullcolour.png', window.location.href).href;
        const fontNormalUrl = new URL('assets/SansaPro-Normal.woff', window.location.href).href;
        const fontLightUrl = new URL('assets/SansaPro-Light.woff', window.location.href).href;
        const fontSemiBoldUrl = new URL('assets/SansaPro-SemiBold.woff', window.location.href).href;
        const fontBoldUrl = new URL('assets/SansaPro-Bold.woff', window.location.href).href;
        const pdfFileTitle = buildAuditPdfFilename(report, projectName);
        const isDesktopExport = Boolean(window.auditLbcDesktop && window.auditLbcDesktop.isDesktop);
        const totalChecklistAnswered = checklistItems.filter((item) => Boolean(normalizeChecklistItem(data.checklist[item.id]).answer)).length;
        const totalCobenefitPoints = cobenefitGroups.reduce((sum, group) => sum + toNumber(normalizeCobenefitItem(data.cobenefits[group.id]).points), 0);
        const fieldAuditTotals = computeFieldAuditTotals(stands);

        const formatDateOnly = (value) => {
            const text = String(value || '').trim();
            if (!text) return '';
            const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) return `${match[3]}/${match[2]}/${match[1]}`;
            return text;
        };

        const signatureDate = new Date();
        const signatureName = report.conclusion_auditorName || report.base_leadAuditor || 'Auditeur';
        const signatureLabel = signatureDate.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

        const pdfCard = (label, value) => `
            <div class="pdf-meta">
                <div class="label">${escapeHtml(label)}</div>
                <div class="value">${value ? value : '<span class="pdf-muted">—</span>'}</div>
            </div>
        `;

        const pdfStandCard = (row, index) => {
            const selectedParcels = Array.isArray(row.selectedParcelIds) ? row.selectedParcelIds : [];
            return `
                <article class="pdf-stand-card">
                    <div class="pdf-stand-header">
                        <strong>Tènement ${index + 1}</strong>
                        <span class="pdf-badge">${row.successOk ? 'Réussi' : 'À vérifier'}</span>
                    </div>
                    <div class="pdf-stand-grid">
                        ${pdfCard('Nom / parcelles', escapeHtml(row.name || ''))}
                        ${pdfCard('Parcelles', selectedParcels.length ? escapeHtml(selectedParcels.join(' ; ')) : '<span class="pdf-muted">—</span>')}
                        ${pdfCard('Type', escapeHtml(row.typeLabel || ''))}
                        ${pdfCard('Surface', `${formatDecimal(row.surfaceHa, 2)} ha`)}
                        ${pdfCard('Objectif densité', `${formatInteger(row.objectiveDensity)} plants/ha`)}
                        ${pdfCard('Densité initiale', `${formatInteger(row.initialDensity)} plants/ha`)}
                        ${pdfCard('Plants vivants', formatInteger(row.alive))}
                        ${pdfCard('Plants morts', formatInteger(row.dead))}
                        ${pdfCard('Taux vivants', formatPercent(row.alivePercent, 0))}
                        ${pdfCard('Densité vivante', `${formatInteger(row.livingDensity)} plants/ha`)}
                        ${pdfCard('Comptage statistique', formatPercent(row.samplePercent, 0))}
                        ${pdfCard('Plants à compter', formatInteger(row.plantsToCount))}
                        ${pdfCard('Plants comptés', formatInteger(row.counted))}
                        ${pdfCard('Restant à compter', formatInteger(row.plantsRemaining))}
                        ${pdfCard('Comptage stat.', row.countingOk ? '<span class="pdf-ok">Conforme</span>' : '<span class="pdf-ko">Non conforme</span>')}
                        ${pdfCard('Réussite plantation', row.successOk ? '<span class="pdf-ok">Réussi</span>' : '<span class="pdf-ko">Non réussi</span>')}
                    </div>
                </article>
            `;
        };

        const pdfFieldAuditConsolidated = () => {
            if (!stands.length) return '';
            return `
                <div class="pdf-field-consolidated">
                    <h3>Résultats pondérés consolidés - tous tènements</h3>
                    <div class="pdf-summary-grid">
                        ${pdfCard('Surface totale auditée', `${formatDecimal(fieldAuditTotals.totalSurface, 2)} ha`)}
                        ${pdfCard('Objectif densité pondéré', `${formatInteger(fieldAuditTotals.weightedObjectiveDensity)} plants/ha`)}
                        ${pdfCard('Densité initiale pondérée', `${formatInteger(fieldAuditTotals.weightedInitialDensity)} plants/ha`)}
                        ${pdfCard('Densité vivante pondérée', `${formatInteger(fieldAuditTotals.weightedLivingDensity)} plants/ha`)}
                        ${pdfCard('Plants vivants', formatInteger(fieldAuditTotals.totalAlive))}
                        ${pdfCard('Plants morts', formatInteger(fieldAuditTotals.totalDead))}
                        ${pdfCard('Taux vivants consolidé', formatPercent(fieldAuditTotals.totalAlivePercent, 0))}
                        ${pdfCard('Plants à compter', formatInteger(fieldAuditTotals.totalPlantsToCount))}
                        ${pdfCard('Plants comptés', formatInteger(fieldAuditTotals.totalCounted))}
                        ${pdfCard('Restant à compter', formatInteger(fieldAuditTotals.totalPlantsRemaining))}
                        ${pdfCard('Comptage stat.', fieldAuditTotals.countingOk ? '<span class="pdf-ok">Conforme</span>' : '<span class="pdf-ko">Non conforme</span>')}
                        ${pdfCard('Réussite plantation', fieldAuditTotals.successOk ? '<span class="pdf-ok">Réussi</span>' : '<span class="pdf-ko">Non réussi</span>')}
                    </div>
                </div>
            `;
        };

        const renderTextBlock = (label, value, extraClass = '') => `<div class="pdf-text-block ${extraClass}"><span>${escapeHtml(label)}</span><strong>${value ? value : '<span class="pdf-muted">—</span>'}</strong></div>`;

        const reportBlockDisplayValue = (block) => {
            if (!block || !block.field) return '';
            const options = block.options || {};
            const mode = getReportValueMode(block);
            const rawValue = report[block.field];
            let value = rawValue;
            if ((value === undefined || value === null || String(value).trim() === '') && ['default', 'fixed'].includes(mode)) {
                value = options.defaultValue || '';
            }
            const text = String(value ?? '').trim();
            if (!text) return '';
            if (block.format === 'date') return escapeHtml(formatDateOnly(text));
            if (block.format === 'integer') {
                const n = Number(normalizeDecimalInput(text));
                return Number.isFinite(n) ? escapeHtml(n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })) : escapeHtml(text);
            }
            if (block.format === 'decimal') {
                const digits = Math.max(0, Number(options.decimals || 2));
                const n = Number(normalizeDecimalInput(text));
                return Number.isFinite(n) ? escapeHtml(n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })) : escapeHtml(text);
            }
            if (block.format === 'percentage') {
                const digits = Math.max(0, Number(options.decimals || 2));
                return escapeHtml(formatPercentageOrNa(text, digits));
            }
            return escapeHtml(text).replace(/\n/g, '<br>');
        };

        const renderReportSpecialBlockPdf = (block) => {
            const fullClass = block.full || block.wide ? 'pdf-block-full' : '';
            if (block.special === 'otherAuditorsList') {
                const rows = Array.isArray(report.base_otherAuditorsList) ? report.base_otherAuditorsList.filter((item) => item && (item.auditor || item.name || item.status || item.qualification)) : [];
                const list = rows.map((item) => {
                    const name = item.auditor || item.name || '';
                    const details = [item.status, item.qualification].filter(Boolean).join(' — ');
                    return `<li>${escapeHtml(name)}${details ? ` — ${escapeHtml(details)}` : ''}</li>`;
                }).join('');
                return `<div class="pdf-text-block ${fullClass}"><span>${escapeHtml(block.label || 'Autres auditeurs')}</span><strong>${rows.length ? '' : '<span class="pdf-muted">—</span>'}</strong>${rows.length ? `<ul class="pdf-list">${list}</ul>` : ''}</div>`;
            }
            if (block.special === 'otherPeopleList') {
                const rows = Array.isArray(report.client_otherPeopleList) ? report.client_otherPeopleList.filter((item) => item && (item.name || item.role)) : [];
                const list = rows.map((item) => `<li>${escapeHtml(item.name || '')}${item.role ? ` — ${escapeHtml(item.role)}` : ''}</li>`).join('');
                return `<div class="pdf-text-block ${fullClass}"><span>${escapeHtml(block.label || 'Personnes consultées')}</span><strong>${rows.length ? '' : '<span class="pdf-muted">—</span>'}</strong>${rows.length ? `<ul class="pdf-list">${list}</ul>` : ''}</div>`;
            }
            if (block.special === 'fertilityRows') {
                const rows = Array.isArray(report.project_fertilityRows) ? report.project_fertilityRows.filter((item) => item && (item.species || item.classValue || item.class || item.comment)) : [];
                const list = rows.map((item) => `<li>${escapeHtml(item.species || 'Essence non renseignée')}${item.classValue || item.class ? ` — ${escapeHtml(item.classValue || item.class)}` : ''}${item.comment ? ` — ${escapeHtml(item.comment)}` : ''}</li>`).join('');
                return `<div class="pdf-text-block ${fullClass}"><span>${escapeHtml(block.label || 'Classe de fertilité retenue')}</span><strong>${rows.length ? '' : '<span class="pdf-muted">—</span>'}</strong>${rows.length ? `<ul class="pdf-list">${list}</ul>` : ''}</div>`;
            }
            return '';
        };

        const renderReportBlockPdf = (block) => {
            if (!block) return '';
            if (block.special) return renderReportSpecialBlockPdf(block);
            if (!block.field) return '';
            const value = reportBlockDisplayValue(block);
            const fullClass = block.full || block.wide || block.format === 'textarea' ? 'pdf-block-full' : '';
            return renderTextBlock(block.label || block.field, value, fullClass);
        };

        const dynamicReportSections = (() => {
            let schema;
            try {
                schema = reportSchema();
            } catch (_) {
                schema = appState && appState.admin && appState.admin.reportSchema ? normalizeReportSchema(appState.admin.reportSchema) : defaultReportSchema();
            }
            const sections = Array.isArray(schema.sections) ? schema.sections : [];
            return sections
                .filter((section) => section && !isLockedReportSectionTitle(section.title || ''))
                .map((section) => {
                    const blocks = Array.isArray(section.blocks) ? section.blocks : [];
                    const blockHtml = blocks.map(renderReportBlockPdf).filter(Boolean).join('');
                    if (!blockHtml) return '';
                    return `<section class="pdf-section"><h2>${escapeHtml(section.title || 'Section du rapport')}</h2><div class="pdf-summary-grid">${blockHtml}</div></section>`;
                })
                .filter(Boolean)
                .join('');
        })();

        const emissionRows = [
            ['REA forêt avant rabais', report.em_reaForestBeforeProject, report.em_reaForestBeforeAudit, report.em_reaForestBeforeJustification],
            ['REA produits avant rabais', report.em_reaProductsBeforeProject, report.em_reaProductsBeforeAudit, report.em_reaProductsBeforeJustification],
            ['REI substitution avant rabais', report.em_reiSubBeforeProject, report.em_reiSubBeforeAudit, report.em_reiSubBeforeJustification],
            ['REE avant rabais', report.em_reeBeforeProject, report.em_reeBeforeAudit, report.em_reeBeforeJustification],
            ['Rabais 1 - Additionnalité (%)', report.em_discount1Project, report.em_discount1Audit, report.em_discount1Justification],
            ['Rabais 2 - Risques généraux (%)', report.em_discount2Project, report.em_discount2Audit, report.em_discount2Justification],
            ['Rabais 3 - Risque d’incendie (%)', report.em_discount3Project, report.em_discount3Audit, report.em_discount3Justification],
            ['Rabais 4 - Non justification de la classe (%)', report.em_discount4Project, report.em_discount4Audit, report.em_discount4Justification],
            ['Rabais 5 - Vérification additionnelle de terrain (%)', report.em_discount5Project, report.em_discount5Audit, report.em_discount5Justification],
            ['REA forêt après rabais', report.em_reaForestAfterProject, report.em_reaForestAfterAudit, report.em_reaForestAfterJustification],
            ['REA produits après rabais', report.em_reaProductsAfterProject, report.em_reaProductsAfterAudit, report.em_reaProductsAfterJustification],
            ['REI substitution après rabais', report.em_reiSubAfterProject, report.em_reiSubAfterAudit, report.em_reiSubAfterJustification],
            ['REE après rabais', report.em_reeAfterProject, report.em_reeAfterAudit, report.em_reeAfterJustification]
        ].map((row) => `
            <tr>
                <td>${escapeHtml(row[0])}</td>
                <td>${escapeHtml(row[0].includes('Rabais') ? formatPercentageOrNa(row[1], 2) : formatDecimal(row[1], 2))}</td>
                <td>${escapeHtml(row[0].includes('Rabais') ? formatPercentageOrNa(row[2], 2) : formatDecimal(row[2], 2))}</td>
                <td>${escapeHtml(row[3] || '')}</td>
            </tr>
        `).join('');

        const pdfChecklistAlertsByItemId = new Map(getChecklistCobenefitAlerts(data).map((alert) => [alert.checklistItem.id, alert]));
        const checklistByCategory = checklistItems.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {});
        const checklistSections = Object.entries(checklistByCategory).map(([category, items]) => `
            <div class="pdf-subsection">
                <h3>${escapeHtml(category)}</h3>
                <table class="pdf-table pdf-table-tight pdf-table-checklist">
                    <thead>
                        <tr><th>N°</th><th>Question</th><th>Type</th><th>Réponse</th><th>Commentaire</th></tr>
                    </thead>
                    <tbody>
                        ${items.map((item) => {
                            const value = normalizeChecklistItem(data.checklist[item.id]);
                            const answer = formatChecklistAnswer(value.answer);
                            const q = `${item.title}${item.detail ? ` — ${item.detail}` : ''}`;
                            const alert = pdfChecklistAlertsByItemId.get(item.id);
                            const alertText = alert ? `<div class="pdf-alert">Alerte : co-bénéfice demandé (${alert.groups.map((group) => escapeHtml(group.title)).join(' ; ')}).</div>` : '';
                            return `<tr class="${alert ? 'pdf-row-alert' : ''}"><td>${escapeHtml(item.number || '')}</td><td>${escapeHtml(q)}${alertText}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(answer)}</td><td>${escapeHtml(value.comment || '')}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `).join('');

        const cobenefitByCategory = cobenefitGroups.reduce((acc, group) => {
            (acc[group.category] = acc[group.category] || []).push(group);
            return acc;
        }, {});
        const cobenefitSections = Object.entries(cobenefitByCategory).map(([category, groups]) => `
            <div class="pdf-subsection">
                <h3>${escapeHtml(category)}</h3>
                <table class="pdf-table pdf-table-tight pdf-table-cobenefits">
                    <thead>
                        <tr><th>N°</th><th>Co-bénéfice</th><th>Réponse</th><th>Points</th><th>Critère</th></tr>
                    </thead>
                    <tbody>
                        ${groups.map((group, index) => {
                            const value = normalizeCobenefitItem(data.cobenefits[group.id]);
                            const selected = group.options.find((option) => option.id === value.ruleId);
                            return `<tr><td>${escapeHtml(String(index + 1))}</td><td>${escapeHtml(group.title)}</td><td>${escapeHtml(selected ? selected.criterion : 'Non renseigné')}</td><td>${escapeHtml(selected ? String(selected.points) : '')}</td><td>${escapeHtml(selected ? selected.criterion : '')}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${escapeHtml(pdfFileTitle)}</title>
                <style>
                    @page { size: A4; margin: 12mm; }
                    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @font-face { font-family: 'Sansa Pro'; src: url('${fontNormalUrl}') format('woff'); font-weight: 400; font-style: normal; }
                    @font-face { font-family: 'Sansa Pro'; src: url('${fontLightUrl}') format('woff'); font-weight: 300; font-style: normal; }
                    @font-face { font-family: 'Sansa Pro'; src: url('${fontSemiBoldUrl}') format('woff'); font-weight: 600; font-style: normal; }
                    @font-face { font-family: 'Sansa Pro'; src: url('${fontBoldUrl}') format('woff'); font-weight: 700; font-style: normal; }
                    html, body { margin: 0; padding: 0; background: #ffffff; color: #1B1D43; font-family: 'Sansa Pro', 'SansaPro', Arial, Helvetica, sans-serif; }
                    body { font-size: 12px; line-height: 1.35; }
                    .pdf-page { width: 100%; }
                    .pdf-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 0 0 10px; border-bottom: 2.5px solid #1B1D43; margin-bottom: 14px; }
                    .pdf-header img { height: 40px; max-width: 185px; width: auto; object-fit: contain; }
                    .pdf-heading { text-align: right; flex: 1; }
                    .pdf-heading h1 { margin: 0; font-size: 20px; line-height: 1.08; color: #1B1D43; font-weight: 700; }
                    .pdf-heading p { margin: 4px 0 0; font-size: 11px; color: #4d5872; font-weight: 400; }
                    .pdf-section { margin: 15px 0 17px; page-break-inside: avoid; }
                    .pdf-section h2 { margin: 0 0 10px; font-size: 15px; color: #1B1D43; border-left: 5px solid #009BEB; border-bottom: 1px solid #d7dbe5; padding: 4px 0 6px 9px; font-weight: 700; }
                    .pdf-section h3 { margin: 12px 0 7px; font-size: 12px; color: #1B1D43; font-weight: 700; }
                    .pdf-summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                    .pdf-text-block, .pdf-meta { border: 1px solid #d7dbe5; border-radius: 8px; padding: 8px 10px; background: #f8fbff; min-height: 42px; }
                    .pdf-text-block span, .pdf-meta .label { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .035em; color: #5a6478; font-weight: 600; }
                    .pdf-text-block strong, .pdf-meta .value { display: block; margin-top: 3px; font-size: 12px; color: #1B1D43; font-weight: 700; }
                    .pdf-block-full { grid-column: 1 / -1; }
                    .pdf-muted { color: #7a8498; font-weight: 400; }
                    .pdf-grid-stand { display: grid; grid-template-columns: 1fr; gap: 9px; margin-top: 9px; }
                    .pdf-field-consolidated { margin-top: 12px; padding: 10px; border: 1.5px solid #009BEB; border-radius: 10px; background: #f2f9ff; page-break-inside: avoid; }
                    .pdf-field-consolidated h3 { margin: 0 0 8px; font-size: 13px; color: #1B1D43; font-weight: 700; }
                    .pdf-stand-card { border: 1.5px solid #b8c7dc; border-radius: 10px; padding: 0; background: #ffffff; margin-bottom: 10px; overflow: hidden; page-break-inside: avoid; }
                    .pdf-stand-header { display:flex; align-items:center; justify-content:space-between; gap: 10px; margin: 0; padding: 7px 10px; background: #1B1D43; color: #ffffff; }
                    .pdf-stand-header strong { font-size: 13px; color: #ffffff; }
                    .pdf-badge { display:inline-block; padding: 2px 8px; border-radius: 999px; background: #ffffff; color: #1B1D43; font-size: 10px; font-weight: 700; }
                    .pdf-stand-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; padding: 9px; background: #f6f8fb; }
                    .pdf-stand-grid .pdf-meta { background: #ffffff; border-color: #ccd5e4; }
                    .pdf-table { width: 100%; border-collapse: collapse; font-size: 9px; table-layout: fixed; }
                    .pdf-table-tight td, .pdf-table-tight th { padding: 4px 5px; }
                    .pdf-table th, .pdf-table td { border: 1px solid #cfd6e0; padding: 5px 6px; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
                    .pdf-table th { background: #1B1D43; color: #ffffff; }
                    .pdf-table tr:nth-child(even) td { background: #f8fafc; }
                    .pdf-table-checklist th:nth-child(1), .pdf-table-checklist td:nth-child(1) { width: 5%; }
                    .pdf-table-checklist th:nth-child(2), .pdf-table-checklist td:nth-child(2) { width: 44%; }
                    .pdf-table-checklist th:nth-child(3), .pdf-table-checklist td:nth-child(3) { width: 12%; }
                    .pdf-table-checklist th:nth-child(4), .pdf-table-checklist td:nth-child(4) { width: 11%; }
                    .pdf-table-checklist th:nth-child(5), .pdf-table-checklist td:nth-child(5) { width: 28%; }
                    .pdf-table-cobenefits th:nth-child(1), .pdf-table-cobenefits td:nth-child(1) { width: 5%; }
                    .pdf-table-cobenefits th:nth-child(2), .pdf-table-cobenefits td:nth-child(2) { width: 25%; }
                    .pdf-table-cobenefits th:nth-child(3), .pdf-table-cobenefits td:nth-child(3) { width: 30%; }
                    .pdf-table-cobenefits th:nth-child(4), .pdf-table-cobenefits td:nth-child(4) { width: 8%; text-align: center; }
                    .pdf-table-cobenefits th:nth-child(5), .pdf-table-cobenefits td:nth-child(5) { width: 32%; }
                    .pdf-ok { color: #0b6b2d; font-weight: 700; }
                    .pdf-ko { color: #b3261e; font-weight: 700; }
                    .pdf-row-alert td { background: #fde8e6 !important; border-color: #e1a19b; }
                    .pdf-alert { margin-top: 3px; color: #b3261e; font-size: 8.5px; font-weight: 700; }
                    .pdf-subsection { margin-top: 10px; }
                    .pdf-meta-title { margin: 0 0 6px; font-size: 13px; }
                    .pdf-list { margin: 0; padding-left: 18px; }
                    .pdf-footer { margin-top: 12px; font-size: 9px; color: #5a6478; }
                    .pdf-signature-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
                    .pdf-signature-box { width: 280px; border: 1px solid #cfd6e0; border-radius: 10px; padding: 10px 12px; background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%); }
                    .pdf-signature-label { font-size: 10px; text-transform: uppercase; letter-spacing: .03em; color: #5a6478; margin-bottom: 6px; }
                    .pdf-signature-name { font-family: 'Brush Script MT', 'Snell Roundhand', 'Segoe Script', cursive; font-size: 28px; line-height: 1; color: #1B1D43; transform: rotate(-2deg); margin: 10px 0 4px; }
                    .pdf-signature-meta { font-size: 10px; color: #5a6478; }
                    .page-break { page-break-before: always; }
                    @media print {
                        .pdf-section { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="pdf-page">
                    <header class="pdf-header">
                        <img src="${logoUrl}" alt="Control Union">
                        <div class="pdf-heading">
                            <h1>Rapport d'audit Label Bas-Carbone Forêt</h1>
                            <p>${escapeHtml(projectName)} · ${escapeHtml(methodLabel || 'Méthode non renseignée')}</p>
                        </div>
                    </header>

                    ${dynamicReportSections || '<section class="pdf-section"><h2>Rapport</h2><div class="pdf-text-block"><span>Sections modulables</span><strong>Aucune section configurée.</strong></div></section>'}

                    <section class="pdf-section">
                        <h2>Synthèse des réductions d'émissions</h2>
                        <table class="pdf-table">
                            <thead><tr><th>Poste d'émission</th><th>Porteur de projet</th><th>Audit</th><th>Justification</th></tr></thead>
                            <tbody>${emissionRows}</tbody>
                        </table>
                    </section>

                    <section class="pdf-section">
                        <h2>Audit terrain</h2>
                        <div class="pdf-summary-grid">
                            ${pdfCard('Nombre de tènements', formatInteger(stands.length))}
                            ${pdfCard('Surface totale auditée', `${formatDecimal(fieldAuditTotals.totalSurface, 2)} ha`)}
                            ${pdfCard('Plants vivants', formatInteger(fieldAuditTotals.totalAlive))}
                            ${pdfCard('Plants morts', formatInteger(fieldAuditTotals.totalDead))}
                        </div>
                        <div class="pdf-grid-stand">${stands.length ? stands.map((row, index) => pdfStandCard(row, index)).join('') : '<div class="pdf-text-block"><span>Audit terrain</span><strong>Aucun tènement enregistré.</strong></div>'}</div>
                        ${pdfFieldAuditConsolidated()}
                    </section>

                    <section class="pdf-section">
                        <h2>Checklist</h2>
                        ${checklistSections || '<div class="pdf-text-block"><span>Checklist</span><strong>Aucune question applicable.</strong></div>'}
                        <p class="pdf-note">Questions complétées : ${formatInteger(totalChecklistAnswered)} / ${formatInteger(checklistItems.length)}.</p>
                    </section>

                    <section class="pdf-section page-break">
                        <h2>Co-bénéfices</h2>
                        ${cobenefitSections || '<div class="pdf-text-block"><span>Co-bénéfices</span><strong>Aucun co-bénéfice applicable.</strong></div>'}
                        <div class="pdf-summary-grid" style="margin-top:10px;">
                            ${pdfCard('Points totaux', formatDecimal(totalCobenefitPoints, 2))}
                            ${pdfCard('Co-bénéfices complétés', `${formatInteger(cobenefitGroups.filter((group) => Boolean(normalizeCobenefitItem(data.cobenefits[group.id]).ruleId)).length)} / ${formatInteger(cobenefitGroups.length)}`)}
                        </div>
                    </section>

                    <section class="pdf-section">
                        <h2>Conclusion</h2>
                        <div class="pdf-summary-grid">
                            ${pdfCard('Éligibilité', escapeHtml(report.conformity_eligibility || ''))}
                            ${pdfCard('Documentaire', escapeHtml(report.conformity_documentary || ''))}
                            ${pdfCard('Co-bénéfices', escapeHtml(report.conformity_cobenefits || ''))}
                            ${pdfCard('Audit terrain', escapeHtml(report.conformity_fieldAudit || ''))}
                            ${pdfCard('Réductions vérifiées', escapeHtml(report.conclusion_verifiedReductions || ''))}
                            ${pdfCard('Nom de l’auditeur', escapeHtml(report.conclusion_auditorName || ''))}
                        </div>
                        <h3>Co-bénéfices vérifiés</h3>
                        <table class="pdf-table pdf-table-tight">
                            <thead><tr><th>Type</th><th>Résultat (%)</th></tr></thead>
                            <tbody>
                                <tr><td>Socio-économique</td><td>${escapeHtml(formatPercentageOrNa(report.conclusion_socioResult || ''))}</td></tr>
                                <tr><td>Préservation des sols</td><td>${escapeHtml(formatPercentageOrNa(report.conclusion_soilResult || ''))}</td></tr>
                                <tr><td>Biodiversité</td><td>${escapeHtml(formatPercentageOrNa(report.conclusion_biodiversityResult || ''))}</td></tr>
                                <tr><td>Changement climatique</td><td>${escapeHtml(formatPercentageOrNa(report.conclusion_climateResult || ''))}</td></tr>
                                <tr><td>Eau</td><td>${escapeHtml(formatPercentageOrNa(report.conclusion_waterResult || ''))}</td></tr>
                            </tbody>
                        </table>
                        <div class="pdf-text-block" style="margin-top:8px;">
                            <span>Déclaration</span>
                            <strong>${escapeHtml(report.conclusion_statement || '') || '<span class="pdf-muted">—</span>'}</strong>
                        </div>
                        <div class="pdf-text-block" style="margin-top:8px;">
                            <span>Observations de l’auditeur</span>
                            <strong>${escapeHtml(report.conclusion_auditorObservations || '') || '<span class="pdf-muted">—</span>'}</strong>
                        </div>
                        <div class="pdf-text-block" style="margin-top:8px;">
                            <span>Observations du client</span>
                            <strong>${escapeHtml(report.conclusion_clientObservations || '') || '<span class="pdf-muted">—</span>'}</strong>
                        </div>
                        <div class="pdf-signature-wrap">
                            <div class="pdf-signature-box">
                                <div class="pdf-signature-label">Signature automatique</div>
                                <div class="pdf-signature-name">${escapeHtml(signatureName)}</div>
                                <div class="pdf-signature-meta">${escapeHtml(signatureLabel)}</div>
                            </div>
                        </div>
                    </section>

                    <div class="pdf-footer">Document généré depuis l'application d'audit Label Bas-Carbone Forêt le ${escapeHtml(new Date().toLocaleString('fr-FR'))}.</div>
                </div>
                ${isDesktopExport ? '' : `<script>
                    window.addEventListener('load', () => {
                        document.title = '${pdfFileTitle.replace(/'/g, "\'")}';
                        setTimeout(() => {
                            window.print();
                        }, 400);
                    });
                    window.addEventListener('afterprint', () => {
                        window.close();
                    });
                </script>`}
            </body>
            </html>
        `;
    }


    function sanitizeFilenamePart(value, maxLength = 80) {
        const text = String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
        const safe = text.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
        return (safe || 'Projet').slice(0, maxLength);
    }

    function buildAuditPdfFilename(report, fallbackProjectName) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = String(now.getFullYear());
        const method = sanitizeFilenamePart(report && report.project_method, 35);
        const projectName = sanitizeFilenamePart((report && report.project_name) || fallbackProjectName || 'Projet', 85);
        const filename = `Audit_LBC_${method}_${projectName}_${dd}${mm}${yyyy}`;
        return filename.slice(0, 150);
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
                appState.admin = normalizeAdminData(saved.admin || defaultAdminData());
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
            initializeCobenefitsState(project.data);
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
        appState.admin = normalizeAdminData(appState.admin || defaultAdminData());
        appState.projects = appState.projects.map((project) => {
            project.data = Object.assign(createProjectData(), project.data || {});
            project.data.current = Object.assign(defaultCurrent(), project.data.current || {});
            project.data.report = normalizeReport(project.data.report || {});
            initializeCobenefitsState(project.data);
            project.data.parcels = Array.isArray(project.data.parcels) ? project.data.parcels : [];
            project.data.stands = Array.isArray(project.data.stands) ? project.data.stands : [];
            project.data.alive = Number(project.data.alive) || 0;
            project.data.dead = Number(project.data.dead) || 0;
            project.data.editingStandId = project.data.editingStandId || null;
            initializeChecklistState(project.data);
            initializeCobenefitsState(project.data);
            return project;
        });
        if (!currentProject()) appState.activeProjectId = null;
    }


    function normalizeReport(report) {
        const normalized = Object.assign(defaultReport(), report || {});
        if (!String(normalized.client_country || '').trim()) normalized.client_country = 'FRANCE';
        if (!String(normalized.project_country || '').trim()) normalized.project_country = 'FRANCE';
        normalized.base_otherAuditorsList = Array.isArray(normalized.base_otherAuditorsList) ? normalized.base_otherAuditorsList : [];
        normalized.client_otherPeopleList = Array.isArray(normalized.client_otherPeopleList) ? normalized.client_otherPeopleList : [];
        normalized.project_fertilityRows = Array.isArray(normalized.project_fertilityRows) ? normalized.project_fertilityRows : [];
        normalized.reportOverrides = normalized.reportOverrides && typeof normalized.reportOverrides === 'object' ? normalized.reportOverrides : {};
        REPORT_MANUAL_OVERRIDABLE_FIELDS.forEach((field) => {
            if (!String(normalized[field] || '').trim()) delete normalized.reportOverrides[field];
        });
        return normalized;
    }

    function normalizeCobenefitMaxPoints(currentRows, defaultRows = DEFAULT_COBENEFIT_MAX_POINTS) {
        const byCategory = new Map();
        const push = (row, fromDefault = false) => {
            if (!row || typeof row !== 'object') return;
            const category = COBENEFIT_CATEGORIES.includes(row.category) ? row.category : 'Socio-économique';
            const key = normalizeComparisonKey(category);
            const existing = byCategory.get(key) || { category, locked: false, maxPoints: {} };
            byCategory.set(key, {
                category,
                locked: Boolean(existing.locked || fromDefault || row.locked),
                maxPoints: Object.assign({}, existing.maxPoints || {}, row.maxPoints || {})
            });
        };
        (Array.isArray(defaultRows) ? defaultRows : []).forEach((row) => push(row, true));
        (Array.isArray(currentRows) ? currentRows : []).forEach((row) => push(row, false));
        return Array.from(byCategory.values()).map((row) => ({
            category: row.category,
            locked: Boolean(row.locked),
            maxPoints: Object.fromEntries(Object.entries(row.maxPoints || {}).map(([key, value]) => [key, normalizeMaxPointsValue(value)]).filter(([, value]) => value !== ''))
        }));
    }

    function normalizeUsers(currentUsers, defaultUsers) {
        const defaults = Array.isArray(defaultUsers) ? defaultUsers : [];
        const current = Array.isArray(currentUsers) ? currentUsers : [];
        const byEmail = new Map();
        const push = (user, fromDefault = false) => {
            if (!user || typeof user !== 'object') return;
            const email = normalizeEmail(user.email);
            if (!email) return;
            const existing = byEmail.get(email) || {};
            const role = ROLE_LABELS[user.role] ? user.role : (ROLE_LABELS[existing.role] ? existing.role : 'auditor');
            byEmail.set(email, {
                name: String(user.name || existing.name || email).trim(),
                email,
                password: String(user.password || existing.password || '').trim(),
                role,
                active: user.active === false ? false : existing.active !== false,
                locked: Boolean(existing.locked || fromDefault || user.locked)
            });
        };
        defaults.forEach((user) => push(user, true));
        current.forEach((user) => push(user, false));
        return Array.from(byEmail.values()).filter((user) => user.email && user.password);
    }

    function normalizeAuditorAccounts(currentAuditors, defaultAuditors, legacyUsers) {
        const byKey = new Map();
        const findByName = (name) => {
            const key = normalizeComparisonKey(name);
            if (!key) return null;
            return Array.from(byKey.values()).find((row) => normalizeComparisonKey(row.name) === key) || null;
        };
        const push = (row, fromDefault = false) => {
            if (!row || typeof row !== 'object') return;
            const email = normalizeEmail(row.email);
            const name = String(row.name || '').trim();
            if (!email && !name) return;
            const key = email ? `email:${email}` : `name:${normalizeComparisonKey(name)}`;
            const existing = byKey.get(key) || (email ? findByName(name) : null) || {};
            const role = ROLE_LABELS[row.role] ? row.role : (ROLE_LABELS[existing.role] ? existing.role : 'auditor');
            const merged = {
                name: String(name || existing.name || email || '').trim(),
                email: email || normalizeEmail(existing.email),
                password: String(row.password || existing.password || '').trim(),
                role,
                active: row.active === false ? false : existing.active !== false,
                qualifications: String(row.qualifications || row.status || existing.qualifications || '').trim(),
                locked: Boolean(existing.locked || fromDefault || row.locked)
            };
            const finalKey = merged.email ? `email:${merged.email}` : `name:${normalizeComparisonKey(merged.name)}`;
            if (key !== finalKey && byKey.has(key)) byKey.delete(key);
            byKey.set(finalKey, merged);
        };
        (Array.isArray(defaultAuditors) ? defaultAuditors : []).forEach((row) => push(row, true));
        (Array.isArray(currentAuditors) ? currentAuditors : []).forEach((row) => push(row, false));
        (Array.isArray(legacyUsers) ? legacyUsers : []).forEach((user) => {
            const email = normalizeEmail(user && user.email);
            if (!email) return;
            const existingByEmail = byKey.get(`email:${email}`);
            if (existingByEmail) {
                push(Object.assign({}, existingByEmail, user, { qualifications: existingByEmail.qualifications || user.qualifications || '' }), false);
                return;
            }
            const existingByName = findByName(user.name);
            if (existingByName) {
                push(Object.assign({}, existingByName, user, { qualifications: existingByName.qualifications || user.qualifications || '' }), false);
                return;
            }
            push({
                name: user.name || email,
                email,
                password: user.password || '',
                role: user.role || 'auditor',
                active: user.active !== false,
                qualifications: user.qualifications || '',
                locked: Boolean(user.locked)
            }, false);
        });
        return Array.from(byKey.values()).filter((row) => row.name || row.email);
    }

    function syncUsersFromAuditors(auditors) {
        return (auditors || []).map(auditorAccountToUser).filter(Boolean);
    }

    function normalizeAdminData(admin) {
        const defaults = defaultAdminData();
        const clean = Object.assign({}, defaults, admin || {});
        const legacyUsers = normalizeUsers(clean.users, defaults.users);
        clean.auditors = normalizeAuditorAccounts(clean.auditors, defaults.auditors, legacyUsers);
        clean.users = syncUsersFromAuditors(clean.auditors);
        clean.auditorStatuses = mergeStringListWithDefaults(defaults.auditorStatuses, clean.auditorStatuses);
        clean.civilities = mergeStringListWithDefaults(defaults.civilities, clean.civilities);
        clean.auditTypes = mergeStringListWithDefaults(defaults.auditTypes, clean.auditTypes);
        clean.methods = mergeObjectListWithDefaults(
            defaults.methods,
            clean.methods,
            (row) => `${String(row.method || '').trim().toLowerCase()}||${String(row.version || '').trim().toLowerCase()}`
        );
        clean.species = mergeStringListWithDefaults(defaults.species, clean.species);
        clean.customLists = normalizeCustomLists(clean.customLists);
        clean.lbcProjects = Array.isArray(clean.lbcProjects) ? clean.lbcProjects.map(normalizeRegistryProject).filter((row) => row.name || row.reference) : [];
        clean.lbcRegistryLastImport = String(clean.lbcRegistryLastImport || '').trim();
        clean.checklistItems = mergeObjectListWithDefaults(
            defaults.checklistItems,
            Array.isArray(clean.checklistItems) ? clean.checklistItems : [],
            (row) => String(row.id || '').trim()
        ).map((item, index) => ({
            id: item.id || `check-${index + 1}-${createId()}`,
            number: String(item.number || index + 1).trim(),
            category: CHECKLIST_CATEGORIES.includes(item.category) ? item.category : 'Éligibilité',
            title: String(item.title || '').trim(),
            detail: String(item.detail || '').trim(),
            type: String(item.type || '').trim() === 'Obligatoire' ? 'Obligatoire' : 'Le cas échéant',
            locked: Boolean(item.locked),
            applicability: item.applicability && typeof item.applicability === 'object' ? item.applicability : {}
        }));
        if (!clean.checklistItems.length) clean.checklistItems = defaults.checklistItems.slice();
        clean.checklistItems = renumberChecklistItems(sortChecklistItemsByCategory(clean.checklistItems));
        clean.cobenefitRules = mergeObjectListWithDefaults(
            defaults.cobenefitRules,
            Array.isArray(clean.cobenefitRules) ? clean.cobenefitRules : [],
            (row) => String(row.id || '').trim()
        ).map((item, index) => ({
            id: item.id || `cbr-${index + 1}-${createId()}`,
            category: COBENEFIT_CATEGORIES.includes(item.category) ? item.category : 'Socio-économique',
            title: String(item.title || '').trim(),
            criterion: String(item.criterion || '').trim(),
            locked: Boolean(item.locked),
            points: item.points && typeof item.points === 'object' ? Object.assign({}, item.points) : {}
        }));
        if (!clean.cobenefitRules.length) clean.cobenefitRules = defaults.cobenefitRules.slice();
        clean.cobenefitRules = sortCobenefitRulesByCategory(clean.cobenefitRules);
        clean.cobenefitMaxPoints = normalizeCobenefitMaxPoints(clean.cobenefitMaxPoints, defaults.cobenefitMaxPoints);
        clean.reportSchema = normalizeReportSchema(clean.reportSchema || defaults.reportSchema);
        clean.checklistCobenefitMatrix = normalizeChecklistCobenefitMatrix(clean.checklistCobenefitMatrix || {});
        clean.tabOrder = normalizeTabOrder(clean.tabOrder || defaults.tabOrder);
        return clean;
    }


    function normalizeTabOrder(order) {
        const allowed = new Set(DEFAULT_MAIN_TAB_ORDER);
        const result = [];
        (Array.isArray(order) ? order : []).forEach((tabId) => {
            const id = String(tabId || '').trim();
            if (allowed.has(id) && !result.includes(id)) result.push(id);
        });
        DEFAULT_MAIN_TAB_ORDER.forEach((id) => {
            if (!result.includes(id)) result.push(id);
        });
        return result;
    }

    function getMainTabDefinition(tabId) {
        return MAIN_TAB_DEFINITIONS.find((tab) => tab.id === tabId) || MAIN_TAB_DEFINITIONS[0];
    }

    function applyMainTabOrder() {
        const nav = document.querySelector('.tab-nav');
        if (!nav) return;
        const ordered = normalizeTabOrder(appState.admin && appState.admin.tabOrder);
        ordered.forEach((tabId) => {
            const button = nav.querySelector(`.tab-button[data-tab="${tabId}"]`);
            if (button) nav.appendChild(button);
        });
        const adminButton = nav.querySelector('.tab-button[data-tab="admin"]');
        if (adminButton) nav.appendChild(adminButton);
    }

    function getChecklistCobenefitRows() {
        const rows = (appState.admin && Array.isArray(appState.admin.checklistItems)) ? appState.admin.checklistItems : [];
        return rows.filter((item) => ['Audit terrain', 'Co-bénéfices'].includes(item.category)).map((item, index) => ({
            id: item.id || `check-${index + 1}`,
            number: item.number || String(index + 1),
            category: item.category || '',
            title: item.title || '',
            detail: item.detail || '',
            type: item.type || 'Obligatoire'
        }));
    }

    function getAdminCobenefitGroupsForMatrix() {
        const rows = (appState.admin && Array.isArray(appState.admin.cobenefitRules)) ? appState.admin.cobenefitRules : [];
        const map = new Map();
        rows.filter((row) => String(row.title || '').trim()).forEach((row) => {
            const id = cobenefitGroupId(row.category, row.title);
            if (!map.has(id)) map.set(id, { id, category: row.category, title: row.title });
        });
        return Array.from(map.values());
    }

    function normalizeChecklistCobenefitMatrix(matrix) {
        const source = matrix && typeof matrix === 'object' ? matrix : {};
        const validRows = new Set(getChecklistCobenefitRows().map((item) => item.id));
        const validCols = new Set(getAdminCobenefitGroupsForMatrix().map((group) => group.id));
        const clean = {};
        Object.entries(source).forEach(([rowId, cols]) => {
            if (!validRows.has(rowId) || !cols || typeof cols !== 'object') return;
            Object.entries(cols).forEach(([colId, enabled]) => {
                if (!enabled || !validCols.has(colId)) return;
                clean[rowId] = clean[rowId] || {};
                clean[rowId][colId] = true;
            });
        });
        return clean;
    }

    function getRequestedCobenefitGroupIds(projectData) {
        const data = projectData || (currentProject() && currentProject().data) || {};
        const requested = new Set();
        getApplicableCobenefitGroups().forEach((group) => {
            const value = normalizeCobenefitItem((data.cobenefits || {})[group.id]);
            if (value.ruleId) requested.add(group.id);
        });
        return requested;
    }

    function checklistAnswerRequiresAlert(answer) {
        return !answer || answer === 'na' || answer === 'non_audite';
    }

    function getChecklistCobenefitAlerts(projectData) {
        const data = projectData || (currentProject() && currentProject().data) || {};
        const matrix = normalizeChecklistCobenefitMatrix(appState.admin && appState.admin.checklistCobenefitMatrix);
        const requested = getRequestedCobenefitGroupIds(data);
        if (!requested.size) return [];
        const groupsById = new Map(getAdminCobenefitGroupsForMatrix().map((group) => [group.id, group]));
        return getChecklistCobenefitRows().reduce((alerts, item) => {
            const linkedRequested = Object.keys(matrix[item.id] || {}).filter((groupId) => requested.has(groupId));
            if (!linkedRequested.length) return alerts;
            const answer = normalizeChecklistItem((data.checklist || {})[item.id]).answer;
            if (!checklistAnswerRequiresAlert(answer)) return alerts;
            alerts.push({
                checklistItem: item,
                groups: linkedRequested.map((groupId) => groupsById.get(groupId)).filter(Boolean)
            });
            return alerts;
        }, []);
    }

    function mergeStringListWithDefaults(defaultList, currentList) {
        const defaults = Array.isArray(defaultList) ? defaultList.map((item) => String(item || '').trim()).filter(Boolean) : [];
        const current = Array.isArray(currentList) ? currentList.map((item) => String(item || '').trim()).filter(Boolean) : [];
        const seen = new Set();
        const result = [];
        const pushUnique = (value) => {
            const text = String(value || '').trim();
            if (!text) return;
            const key = text.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            result.push(text);
        };
        defaults.forEach(pushUnique);
        current.forEach(pushUnique);
        return result;
    }

    function normalizeCustomLists(lists) {
        const source = Array.isArray(lists) ? lists : [];
        const byName = new Map();
        const order = [];
        source.forEach((item, index) => {
            if (!item || typeof item !== 'object') return;
            const fallbackName = `Liste ${index + 1}`;
            const name = String(item.name || fallbackName).trim() || fallbackName;
            const key = name.toLowerCase();
            const rawValues = Array.isArray(item.values) ? item.values : String(item.values || '').split(/\r?\n/);
            const values = uniqueValues(rawValues.map((value) => String(value || '').trim()).filter(Boolean));
            if (!byName.has(key)) {
                byName.set(key, { id: String(item.id || `custom_list_${createId()}`).trim(), name, values: [] });
                order.push(key);
            }
            const target = byName.get(key);
            target.values = uniqueValues(target.values.concat(values));
        });
        return order.map((key) => byName.get(key));
    }

    function mergeObjectListWithDefaults(defaultList, currentList, keyFn) {
        const defaults = Array.isArray(defaultList) ? defaultList : [];
        const current = Array.isArray(currentList) ? currentList : [];
        const seen = new Set();
        const result = [];
        const pushUnique = (item, locked) => {
            if (!item || typeof item !== 'object') return;
            const cloned = Object.assign({}, item, locked ? { locked: true } : {});
            const key = String(keyFn(cloned) || '').trim();
            if (!key) return;
            if (seen.has(key)) return;
            seen.add(key);
            result.push(cloned);
        };
        defaults.forEach((item) => pushUnique(item, true));
        current.forEach((item) => pushUnique(item, Boolean(item.locked)));
        return result;
    }

    const COBENEFIT_CATEGORIES = ['Socio-économique', 'Préservation des sols', 'Biodiversité', 'Changement climatique', 'Eau'];

    function getAdminLockCount(listName) {
        return ADMIN_LOCK_COUNTS[listName] || 0;
    }

    function isAdminRowLocked(listName, index, item) {
        if (item && item.locked) return true;
        return Number(index) < getAdminLockCount(listName);
    }


    function sortCobenefitRulesByCategory(items) {
        return (items || []).slice().sort((a, b) => {
            const ca = COBENEFIT_CATEGORIES.indexOf(a.category);
            const cb = COBENEFIT_CATEGORIES.indexOf(b.category);
            if (ca !== cb) return ca - cb;
            return 0;
        });
    }

    function normalizeCobenefitOrdering() {
        ensureAdminDataShape();
        appState.admin.cobenefitRules = sortCobenefitRulesByCategory(appState.admin.cobenefitRules || []);
    }

    function sortChecklistItemsByCategory(items) {
        return (items || []).slice().sort((a, b) => {
            const ca = CHECKLIST_CATEGORIES.indexOf(a.category);
            const cb = CHECKLIST_CATEGORIES.indexOf(b.category);
            if (ca !== cb) return ca - cb;
            return 0;
        });
    }

    function renumberChecklistItems(items) {
        return (items || []).map((item, index) => Object.assign({}, item, { number: String(index + 1) }));
    }

    function normalizeChecklistOrdering() {
        ensureAdminDataShape();
        appState.admin.checklistItems = renumberChecklistItems(sortChecklistItemsByCategory(appState.admin.checklistItems || []));
    }

    function cleanStringList(value, fallback) {
        const list = Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
        return list.length ? Array.from(new Set(list)) : fallback.slice();
    }

    function populateReportControls() {
        ensureAdminDataShape();
        const admin = appState.admin;
        populateReportSchemaSelect(els.reportLeadAuditor, getActiveAuditors().map((a) => a.name), 'Sélectionner un auditeur');
        populateReportSchemaSelect(els.clientContactTitle, admin.civilities, 'Sélectionner');
        populateReportSchemaSelect(els.projectAuditType, admin.auditTypes, 'Sélectionner');
        populateReportSchemaSelect(els.projectMethod, uniqueValues(admin.methods.map((m) => m.method)), 'Sélectionner une méthode');
        updateMethodVersionOptions(false);
        populateRegistryDatalist();
    }

    function fillSelect(select, values, placeholder) {
        if (!select) return;
        const previous = select.value;
        const options = [`<option value="">${escapeHtml(placeholder || 'Sélectionner')}</option>`]
            .concat(values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`));
        select.innerHTML = options.join('');
        if (values.includes(previous)) select.value = previous;
    }

    function uniqueValues(values) {
        return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
    }

    function syncLeadAuditorQualification(save = true) {
        const project = currentProject();
        if (!project || !els.reportLeadAuditor || !els.reportLeadQualification) return;
        project.data.report = normalizeReport(project.data.report);
        applyReportValueRules(project.data.report);
        els.reportLeadQualification.value = project.data.report.base_qualifications || '';
        if (save) updateReportFromForm();
    }

    function updateMethodVersionOptions(forceDefault) {
        if (!els.projectMethodVersion) return;
        const versionSource = getReportSchemaBlockListSource(els.projectMethodVersion, 'methodVersions');
        if (versionSource !== 'methodVersions') {
            populateReportSchemaSelect(els.projectMethodVersion, [], 'Sélectionner');
            return;
        }
        const selectedMethod = getReportSchemaBlockListSource(els.projectMethod, 'methods') === 'methods' && els.projectMethod ? els.projectMethod.value : '';
        const versions = (appState.admin.methods || [])
            .filter((item) => !selectedMethod || item.method === selectedMethod)
            .map((item) => item.version)
            .filter(Boolean);
        const previous = els.projectMethodVersion.value;
        fillSelect(els.projectMethodVersion, uniqueValues(versions), 'Sélectionner une version');
        if (versions.includes(previous)) {
            els.projectMethodVersion.value = previous;
        } else if (forceDefault && versions.length) {
            els.projectMethodVersion.value = versions[0];
        }
    }

    function report() {
        const project = currentProject();
        if (!project) return null;
        project.data.report = normalizeReport(project.data.report || {});
        return project.data.report;
    }

    const postalCityCache = new Map();

    function postalCityFieldIds(scope) {
        const prefix = scope === 'project' ? 'project' : 'client';
        return {
            zipField: `${prefix}_zip`,
            cityField: `${prefix}_city`,
            datalistId: prefix === 'project' ? 'projectCityDatalist' : 'clientCityDatalist'
        };
    }

    function normalizePostalCode(value) {
        return digitOnly(value, 5);
    }

    async function getCitiesForPostalCode(zip) {
        const code = normalizePostalCode(zip);
        if (code.length !== 5) return [];
        if (postalCityCache.has(code)) return postalCityCache.get(code);
        try {
            const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(code)}&fields=nom,codesPostaux&format=json&geometry=centre`, { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const rows = await response.json();
            const cities = uniqueValues((Array.isArray(rows) ? rows : []).map((row) => row && row.nom).filter(Boolean)).sort((a, b) => a.localeCompare(b, 'fr'));
            postalCityCache.set(code, cities);
            try { localStorage.setItem(`audit_lbc_cities_${code}`, JSON.stringify(cities)); } catch (_) {}
            return cities;
        } catch (_) {
            try {
                const cached = JSON.parse(localStorage.getItem(`audit_lbc_cities_${code}`) || '[]');
                if (Array.isArray(cached)) return cached.map((value) => String(value || '').trim()).filter(Boolean);
            } catch (_) {}
            return [];
        }
    }

    async function refreshPostalCityOptions(scope, clearInvalid = false) {
        const ids = postalCityFieldIds(scope);
        const zipEl = reportFieldEl(ids.zipField);
        const cityEl = reportFieldEl(ids.cityField);
        const listEl = document.getElementById(ids.datalistId);
        if (!zipEl || !cityEl || !listEl) return;
        const code = normalizePostalCode(zipEl.value);
        if (zipEl.value !== code) zipEl.value = code;
        if (code.length !== 5) {
            listEl.innerHTML = '';
            cityEl.removeAttribute('title');
            cityEl.classList.remove('needs-justification');
            return;
        }
        const cities = await getCitiesForPostalCode(code);
        listEl.innerHTML = cities.map((city) => `<option value="${escapeHtml(city)}"></option>`).join('');
        const currentCity = String(cityEl.value || '').trim();
        const cityIsValid = !currentCity || !cities.length || cities.some((city) => normalizeComparisonKey(city) === normalizeComparisonKey(currentCity));
        if (clearInvalid && currentCity && cities.length && !cityIsValid) {
            cityEl.value = '';
            const project = currentProject();
            if (project && project.data && project.data.report) {
                project.data.report[ids.cityField] = '';
                persist();
            }
        }
        validatePostalCitySelection(scope);
    }

    function validatePostalCitySelection(scope) {
        const ids = postalCityFieldIds(scope);
        const cityEl = reportFieldEl(ids.cityField);
        const listEl = document.getElementById(ids.datalistId);
        if (!cityEl || !listEl) return true;
        const city = String(cityEl.value || '').trim();
        const options = Array.from(listEl.options || []).map((option) => option.value).filter(Boolean);
        const valid = !city || !options.length || options.some((value) => normalizeComparisonKey(value) === normalizeComparisonKey(city));
        cityEl.classList.toggle('needs-justification', !valid);
        cityEl.title = valid ? '' : 'Ville non proposée pour ce code postal.';
        return valid;
    }

    function renderReportDynamicLists() {
        renderOtherAuditors();
        renderOtherPeople();
        renderFertilityRows();
    }

    function renderOtherAuditors() {
        const data = report();
        if (!data || !els.otherAuditorsList) return;
        const rows = data.base_otherAuditorsList.length ? data.base_otherAuditorsList : [];
        els.otherAuditorsList.innerHTML = rows.map((row, index) => `
            <div class="dynamic-row">
                <select data-other-auditor-index="${index}" data-field="auditor">${optionsHtml(getActiveAuditors().map((a) => a.name), row.auditor, 'Auditeur')}</select>
                <select data-other-auditor-index="${index}" data-field="status">${optionsHtml(appState.admin.auditorStatuses, row.status, 'Statut')}</select>
                <button class="small-danger-button" type="button" data-remove-other-auditor="${index}">Supprimer</button>
            </div>
        `).join('') || '<p class="dynamic-empty">Aucun autre auditeur renseigné.</p>';
    }

    function addOtherAuditorRow() {
        const data = report();
        if (!data) return;
        data.base_otherAuditorsList.push({ auditor: '', status: '' });
        renderOtherAuditors();
        updateReportFromForm();
    }

    function removeOtherAuditorRow(index) {
        const data = report();
        if (!data) return;
        data.base_otherAuditorsList.splice(index, 1);
        renderOtherAuditors();
        updateReportFromForm();
    }

    function updateOtherAuditorsFromDom() {
        const data = report();
        if (!data || !els.otherAuditorsList) return;
        data.base_otherAuditorsList = Array.from(els.otherAuditorsList.querySelectorAll('.dynamic-row')).map((row) => ({
            auditor: row.querySelector('[data-field="auditor"]')?.value || '',
            status: row.querySelector('[data-field="status"]')?.value || ''
        }));
        updateReportFromForm();
    }

    function renderOtherPeople() {
        const data = report();
        if (!data || !els.otherPeopleList) return;
        els.otherPeopleList.innerHTML = data.client_otherPeopleList.map((row, index) => `
            <div class="dynamic-row">
                <input data-other-person-index="${index}" data-field="name" value="${escapeHtml(row.name || '')}" placeholder="Nom de la personne">
                <input data-other-person-index="${index}" data-field="role" value="${escapeHtml(row.role || '')}" placeholder="Rôle / fonction">
                <button class="small-danger-button" type="button" data-remove-other-person="${index}">Supprimer</button>
            </div>
        `).join('') || '<p class="dynamic-empty">Aucune personne consultée renseignée.</p>';
    }

    function addOtherPersonRow() {
        const data = report();
        if (!data) return;
        data.client_otherPeopleList.push({ name: '', role: '' });
        renderOtherPeople();
        updateReportFromForm();
    }

    function removeOtherPersonRow(index) {
        const data = report();
        if (!data) return;
        data.client_otherPeopleList.splice(index, 1);
        renderOtherPeople();
        updateReportFromForm();
    }

    function updateOtherPeopleFromDom() {
        const data = report();
        if (!data || !els.otherPeopleList) return;
        data.client_otherPeopleList = Array.from(els.otherPeopleList.querySelectorAll('.dynamic-row')).map((row) => ({
            name: row.querySelector('[data-field="name"]')?.value || '',
            role: row.querySelector('[data-field="role"]')?.value || ''
        }));
        updateReportFromForm();
    }

    function renderFertilityRows() {
        const data = report();
        if (!data || !els.fertilityRows) return;
        els.fertilityRows.innerHTML = data.project_fertilityRows.map((row, index) => `
            <div class="dynamic-row fertility-row">
                <select data-fertility-index="${index}" data-field="species">${optionsHtml(appState.admin.species, row.species, 'Essence')}</select>
                <input data-fertility-index="${index}" data-field="classValue" value="${escapeHtml(row.classValue || '')}" placeholder="Classe / note, ex : 3/9">
                <button class="small-danger-button" type="button" data-remove-fertility-row="${index}">Supprimer</button>
            </div>
        `).join('') || '<p class="dynamic-empty">Aucune classe de fertilité renseignée.</p>';
    }

    function addFertilityRow() {
        const data = report();
        if (!data) return;
        data.project_fertilityRows.push({ species: '', classValue: '' });
        renderFertilityRows();
        updateReportFromForm();
    }

    function removeFertilityRow(index) {
        const data = report();
        if (!data) return;
        data.project_fertilityRows.splice(index, 1);
        renderFertilityRows();
        updateReportFromForm();
    }

    function updateFertilityRowsFromDom() {
        const data = report();
        if (!data || !els.fertilityRows) return;
        data.project_fertilityRows = Array.from(els.fertilityRows.querySelectorAll('.dynamic-row')).map((row) => ({
            species: row.querySelector('[data-field="species"]')?.value || '',
            classValue: row.querySelector('[data-field="classValue"]')?.value || ''
        }));
        updateReportFromForm();
    }

    function optionsHtml(values, selected, placeholder) {
        return [`<option value="">${escapeHtml(placeholder || 'Sélectionner')}</option>`]
            .concat((values || []).map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`))
            .join('');
    }

    function ensureAdminDataShape() {
        const defaults = defaultAdminData();
        appState.admin = appState.admin || {};
        if (!Array.isArray(appState.admin.users)) appState.admin.users = defaults.users.slice();
        if (!Array.isArray(appState.admin.auditors)) appState.admin.auditors = defaults.auditors.slice();
        appState.admin.auditors = normalizeAuditorAccounts(appState.admin.auditors, defaults.auditors, appState.admin.users);
        appState.admin.users = syncUsersFromAuditors(appState.admin.auditors);
        if (!Array.isArray(appState.admin.auditorStatuses)) appState.admin.auditorStatuses = defaults.auditorStatuses.slice();
        if (!Array.isArray(appState.admin.civilities)) appState.admin.civilities = defaults.civilities.slice();
        if (!Array.isArray(appState.admin.auditTypes)) appState.admin.auditTypes = defaults.auditTypes.slice();
        if (!Array.isArray(appState.admin.methods)) appState.admin.methods = defaults.methods.slice();
        if (!Array.isArray(appState.admin.species)) appState.admin.species = defaults.species.slice();
        if (!Array.isArray(appState.admin.customLists)) appState.admin.customLists = [];
        appState.admin.customLists = normalizeCustomLists(appState.admin.customLists);
        if (!Array.isArray(appState.admin.lbcProjects)) appState.admin.lbcProjects = [];
        if (typeof appState.admin.lbcRegistryLastImport !== 'string') appState.admin.lbcRegistryLastImport = '';
        if (!Array.isArray(appState.admin.checklistItems)) appState.admin.checklistItems = defaults.checklistItems.slice();
        if (!Array.isArray(appState.admin.cobenefitRules)) appState.admin.cobenefitRules = defaults.cobenefitRules.slice();
        if (!Array.isArray(appState.admin.cobenefitMaxPoints)) appState.admin.cobenefitMaxPoints = defaults.cobenefitMaxPoints.slice();
        if (!appState.admin.reportSchema || !Array.isArray(appState.admin.reportSchema.sections)) appState.admin.reportSchema = cloneReportSchema(defaults.reportSchema);
        appState.admin.reportSchema = normalizeReportSchema(appState.admin.reportSchema);
        if (!appState.admin.checklistCobenefitMatrix || typeof appState.admin.checklistCobenefitMatrix !== 'object') appState.admin.checklistCobenefitMatrix = {};
        if (!Array.isArray(appState.admin.tabOrder)) appState.admin.tabOrder = defaults.tabOrder.slice();
        appState.admin.tabOrder = normalizeTabOrder(appState.admin.tabOrder);
        appState.admin.checklistItems = renumberChecklistItems(sortChecklistItemsByCategory(appState.admin.checklistItems));
        appState.admin.checklistCobenefitMatrix = normalizeChecklistCobenefitMatrix(appState.admin.checklistCobenefitMatrix);
    }


    function getMethodVersionKeys() {
        ensureAdminDataShape();
        return (appState.admin.methods || [])
            .filter((row) => String(row.method || '').trim() && String(row.version || '').trim())
            .map((row) => ({
                method: String(row.method || '').trim(),
                version: String(row.version || '').trim(),
                key: methodVersionKey(row.method, row.version),
                label: `${String(row.method || '').trim()} - ${String(row.version || '').trim()}`
            }));
    }

    function methodVersionKey(method, version) {
        return `${String(method || '').trim()}||${String(version || '').trim()}`;
    }

    function getAdminChecklistItems() {
        ensureAdminDataShape();
        return (appState.admin.checklistItems || []).map((item, index) => ({
            id: item.id || `check-${index + 1}`,
            number: item.number || String(index + 1),
            category: item.category || 'Éligibilité',
            title: item.title || '',
            detail: item.detail || '',
            type: item.type || 'Obligatoire',
            applicability: item.applicability || {}
        }));
    }

    function getSelectedMethodVersionKey() {
        const project = currentProject();
        if (!project) return '';
        const reportData = normalizeReport(project.data.report || {});
        return methodVersionKey(reportData.project_method, reportData.project_methodVersion);
    }

    function getApplicableChecklistItems() {
        const items = getAdminChecklistItems().filter((item) => String(item.title || '').trim());
        const selectedKey = getSelectedMethodVersionKey();
        if (!selectedKey || selectedKey === '||') return items;
        return items.filter((item) => {
            const applicability = item.applicability || {};
            return Boolean(applicability[selectedKey]);
        });
    }

    function parseChecklistNumberTitle(value) {
        const text = String(value || '').trim();
        const match = text.match(/^(\d+[a-zA-Z]*)\s+(.+)$/);
        if (match) return { number: match[1], title: match[2] };
        return { number: '', title: text };
    }

    function renderAdminChecklist() {
        if (!els.adminChecklistHead || !els.adminChecklistBody) return;
        ensureAdminDataShape();
        normalizeChecklistOrdering();
        const methodKeys = getMethodVersionKeys();
        const methodHeader = methodKeys.map((entry) => `<th class="admin-method-col">${escapeHtml(entry.method)}<br><small>${escapeHtml(entry.version)}</small></th>`).join('');
        els.adminChecklistHead.innerHTML = `
            <tr>
                <th>Ordre</th>
                <th>N°</th>
                <th>Catégorie</th>
                <th>Type</th>
                <th>Question</th>
                <th>Détail / preuve attendue</th>
                ${methodHeader}
                <th></th>
            </tr>
        `;
        const items = appState.admin.checklistItems || [];
        if (els.adminChecklistEmpty) els.adminChecklistEmpty.hidden = items.length > 0;
        els.adminChecklistBody.innerHTML = items.map((item, index) => {
            const applicability = item.applicability || {};
            const checks = methodKeys.map((entry) => `
                <td class="admin-check-cell">
                    <input type="checkbox" data-checklist-applicability data-checklist-index="${index}" data-method-key="${escapeHtml(entry.key)}" ${applicability[entry.key] ? 'checked' : ''} aria-label="Applicable ${escapeHtml(entry.label)}">
                </td>
            `).join('');
            const locked = Boolean(item.locked);
            return `
                <tr class="admin-draggable-row ${locked ? 'admin-row-locked' : ''}" draggable="true" data-checklist-row="${index}" data-checklist-category="${escapeHtml(item.category)}">
                    <td class="admin-drag-cell" title="Glisser pour déplacer dans la catégorie">☰</td>
                    <td><span class="admin-number-badge">${escapeHtml(item.number || String(index + 1))}</span></td>
                    <td>
                        <select data-admin-list="checklistItems" data-index="${index}" data-field="category">
                            ${CHECKLIST_CATEGORIES.map((cat) => `<option value="${escapeHtml(cat)}" ${cat === item.category ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
                        </select>
                    </td>
                    <td>
                        <select data-admin-list="checklistItems" data-index="${index}" data-field="type">
                            <option value="Obligatoire" ${item.type === 'Obligatoire' ? 'selected' : ''}>Obligatoire</option>
                            <option value="Le cas échéant" ${item.type !== 'Obligatoire' ? 'selected' : ''}>Le cas échéant</option>
                        </select>
                    </td>
                    <td><input data-admin-list="checklistItems" data-index="${index}" data-field="title" value="${escapeHtml(item.title || '')}" placeholder="Question"></td>
                    <td><textarea data-admin-list="checklistItems" data-index="${index}" data-field="detail" rows="2" placeholder="Détail / preuve attendue">${escapeHtml(item.detail || '')}</textarea></td>
                    ${checks}
                    <td>${locked ? '<span class="admin-lock-badge">Verrouillé</span>' : `<button class="small-danger-button" type="button" data-admin-remove="checklistItems" data-index="${index}">×</button>`}</td>
                </tr>
            `;
        }).join('');
    }

    function renderAdminCobenefits() {
        if (!els.adminCobenefitsHead || !els.adminCobenefitsBody) return;
        ensureAdminDataShape();
        const methodKeys = getMethodVersionKeys();
        const methodHeader = methodKeys.map((entry) => `<th class="admin-method-col">${escapeHtml(entry.method)}<br><small>${escapeHtml(entry.version)}</small></th>`).join('');
        els.adminCobenefitsHead.innerHTML = `
            <tr>
                <th></th>
                <th>N°</th>
                <th>Type</th>
                <th>Intitulé</th>
                <th>Critère d’évaluation / réponse possible</th>
                ${methodHeader}
                <th></th>
            </tr>
        `;
        const items = appState.admin.cobenefitRules || [];
        if (els.adminCobenefitsEmpty) els.adminCobenefitsEmpty.hidden = items.length > 0;
        els.adminCobenefitsBody.innerHTML = items.map((item, index) => {
            const pointInputs = methodKeys.map((entry) => `
                <td class="admin-check-cell">
                    <input class="admin-points-input" type="number" min="0" step="0.01" inputmode="decimal" data-cobenefit-admin-points data-cobenefit-index="${index}" data-method-key="${escapeHtml(entry.key)}" value="${escapeHtml((item.points || {})[entry.key] || '')}" placeholder="—">
                </td>
            `).join('');
            const locked = Boolean(item.locked);
            return `
                <tr class="admin-draggable-row ${locked ? 'admin-row-locked' : ''}" draggable="true" data-cobenefit-row="${index}" data-cobenefit-category="${escapeHtml(item.category)}">
                    <td class="admin-drag-cell" title="Glisser pour déplacer dans la catégorie">☰</td>
                    <td><span class="admin-number-badge">${escapeHtml(String(index + 1))}</span></td>
                    <td>
                        <select data-admin-list="cobenefitRules" data-index="${index}" data-field="category">
                            ${COBENEFIT_CATEGORIES.map((cat) => `<option value="${escapeHtml(cat)}" ${cat === item.category ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
                        </select>
                    </td>
                    <td><input data-admin-list="cobenefitRules" data-index="${index}" data-field="title" value="${escapeHtml(item.title || '')}" placeholder="Intitulé"></td>
                    <td><textarea data-admin-list="cobenefitRules" data-index="${index}" data-field="criterion" rows="2" placeholder="Critère d’évaluation / réponse possible">${escapeHtml(item.criterion || '')}</textarea></td>
                    ${pointInputs}
                    <td>${locked ? '<span class="admin-lock-badge">Verrouillé</span>' : `<button class="small-danger-button" type="button" data-admin-remove="cobenefitRules" data-index="${index}">×</button>`}</td>
                </tr>
            `;
        }).join('');
    }

    function renderAdminCobenefitMaxPoints() {
        if (!els.adminCobenefitMaxHead || !els.adminCobenefitMaxBody) return;
        ensureAdminDataShape();
        const methodKeys = getMethodVersionKeys();
        const methodHeader = methodKeys.map((entry) => `<th class="admin-method-col">${escapeHtml(entry.method)}<br><small>${escapeHtml(entry.version)}</small></th>`).join('');
        els.adminCobenefitMaxHead.innerHTML = `
            <tr>
                <th>Type de co-bénéfice</th>
                ${methodHeader}
                <th></th>
            </tr>
        `;
        const rows = appState.admin.cobenefitMaxPoints || [];
        if (els.adminCobenefitMaxEmpty) els.adminCobenefitMaxEmpty.hidden = rows.length > 0;
        els.adminCobenefitMaxBody.innerHTML = rows.map((row, index) => {
            const locked = Boolean(row.locked);
            const inputs = methodKeys.map((entry) => `
                <td class="admin-check-cell">
                    <input class="admin-points-input" type="text" inputmode="decimal" data-cobenefit-max-points data-cobenefit-max-index="${index}" data-method-key="${escapeHtml(entry.key)}" value="${escapeHtml((row.maxPoints || {})[entry.key] || '')}" placeholder="NA ou points">
                </td>
            `).join('');
            return `
                <tr class="${locked ? 'admin-row-locked' : ''}">
                    <td>
                        <select data-admin-list="cobenefitMaxPoints" data-index="${index}" data-field="category" ${locked ? 'disabled' : ''}>
                            ${COBENEFIT_CATEGORIES.map((cat) => `<option value="${escapeHtml(cat)}" ${cat === row.category ? 'selected' : ''}>${escapeHtml(cat)}</option>`).join('')}
                        </select>
                    </td>
                    ${inputs}
                    <td>${locked ? '<span class="admin-lock-badge">Verrouillé</span>' : `<button class="small-danger-button" type="button" data-admin-remove="cobenefitMaxPoints" data-index="${index}">×</button>`}</td>
                </tr>
            `;
        }).join('');
    }


    const REPORT_FIELD_FORMATS = [
        ['text', 'Texte court'],
        ['integer', 'Nombre entier'],
        ['decimal', 'Nombre avec décimales'],
        ['percentage', 'Pourcentage'],
        ['date', 'Date'],
        ['dropdown', 'Liste déroulante'],
        ['calculated', 'Champ automatique'],
        ['textarea', 'Texte long'],
        ['email', 'Adresse e-mail']
    ];

    const REPORT_DROPDOWN_SOURCES = [
        ['manual', 'Je saisis les choix ici'],
        ['auditors', 'Noms des auditeurs'],
        ['auditorStatuses', 'Statuts / qualifications des auditeurs'],
        ['civilities', 'Civilités'],
        ['auditTypes', 'Types d’audit'],
        ['methods', 'Méthodes'],
        ['methodVersions', 'Versions de méthode'],
        ['species', 'Essences'],
        ['lbcProjects', 'Projets du registre LBC']
    ];

    const REPORT_VALUE_MODES = [
        ['manual', 'L’utilisateur remplit le champ'],
        ['default', 'Préremplir seulement si vide'],
        ['fixed', 'Toujours afficher la même valeur'],
        ['lookup', 'Récupérer une valeur depuis l’Admin'],
        ['calculated', 'Résultat automatique / calculé']
    ];

    const REPORT_LOOKUP_TABLES = [
        ['auditors', 'Table des auditeurs'],
        ['methods', 'Table des méthodes / versions'],
        ['lbcProjects', 'Registre LBC']
    ];

    const REPORT_LOOKUP_FIELDS = {
        auditors: [
            ['name', 'Nom de l’auditeur'],
            ['email', 'Email de connexion'],
            ['qualifications', 'Qualifications / statut de l’auditeur'],
            ['role', 'Rôle dans l’application'],
            ['active', 'Compte actif']
        ],
        methods: [
            ['method', 'Méthode'],
            ['version', 'Version']
        ],
        lbcProjects: [
            ['reference', 'Référence registre'],
            ['name', 'Nom du projet'],
            ['method', 'Méthode'],
            ['region', 'Région'],
            ['holder', 'Porteur de projet'],
            ['notificationDate', 'Date de notification'],
            ['labelDate', 'Date de labellisation']
        ]
    };

    let selectedReportSectionId = '';
    let draggedReportSectionIndex = null;
    let draggedReportBlockIndex = null;

    function cacheReportElements() {
        Object.assign(els, {
            reportLeadAuditor: $('reportLeadAuditor'),
            reportLeadQualification: $('reportLeadQualification'),
            otherAuditorsList: $('otherAuditorsList'),
            addOtherAuditor: $('addOtherAuditor'),
            clientContactTitle: $('clientContactTitle'),
            otherPeopleList: $('otherPeopleList'),
            addOtherPerson: $('addOtherPerson'),
            projectAuditType: $('projectAuditType'),
            projectMethod: $('projectMethod'),
            projectMethodVersion: $('projectMethodVersion'),
            lbcProjectName: $('lbcProjectName'),
            lbcProjectsDatalist: $('lbcProjectsDatalist'),
            lbcProjectHint: $('lbcProjectHint'),
            fertilityRows: $('fertilityRows'),
            addFertilityRow: $('addFertilityRow')
        });
    }

    function cloneReportSchema(schema) {
        return JSON.parse(JSON.stringify(schema || { sections: [] }));
    }

    function inferReportFieldFormat(el) {
        if (!el) return 'text';
        if (el.tagName === 'TEXTAREA') return 'textarea';
        if (el.tagName === 'SELECT') return 'dropdown';
        if (el.readOnly) return 'calculated';
        const type = String(el.getAttribute('type') || 'text').toLowerCase();
        if (type === 'date') return 'date';
        if (type === 'email') return 'email';
        if (type === 'number') {
            const step = String(el.getAttribute('step') || '1');
            return step === '1' ? 'integer' : 'decimal';
        }
        return 'text';
    }

    function inferDropdownListSource(el) {
        const field = String(el?.dataset?.reportField || '');
        const id = String(el?.id || '');
        if (id === 'reportLeadAuditor' || field === 'base_leadAuditor') return 'auditors';
        if (id === 'clientContactTitle' || field === 'client_contactTitle') return 'civilities';
        if (id === 'projectAuditType' || field === 'project_auditType') return 'auditTypes';
        if (id === 'projectMethod' || field === 'project_method') return 'methods';
        if (id === 'projectMethodVersion' || field === 'project_methodVersion') return 'methodVersions';
        return 'manual';
    }

    function inferReportValueOptions(el) {
        const field = String(el?.dataset?.reportField || '');
        if (field === 'base_organization') {
            return {
                valueMode: 'fixed',
                defaultValue: 'Control Union Inspections France',
                systemStyle: true
            };
        }
        if (field === 'base_qualifications') {
            return {
                valueMode: 'lookup',
                lookupSourceTable: 'auditors',
                lookupMatchReportField: 'base_leadAuditor',
                lookupMatchTableField: 'name',
                lookupReturnTableField: 'qualifications',
                systemStyle: true
            };
        }
        if (el && el.readOnly) return { valueMode: 'calculated', systemStyle: true };
        return {};
    }

    function buildDefaultReportSchemaFromDom() {
        const form = document.getElementById('reportForm');
        const sections = [];
        if (!form) return { sections };
        captureLockedReportSectionsFromDom();
        form.querySelectorAll(':scope > .report-section').forEach((section, sIndex) => {
            const title = (section.querySelector('h3')?.textContent || `Section ${sIndex + 1}`).trim();
            if (isLockedReportSectionTitle(title)) return;
            const blocks = [];
            section.querySelectorAll('.field').forEach((fieldNode, bIndex) => {
                const control = fieldNode.querySelector('[data-report-field]');
                const dyn = fieldNode.querySelector('#otherAuditorsList, #otherPeopleList, #fertilityRows');
                if (control) {
                    const field = control.dataset.reportField;
                    const label = (fieldNode.querySelector('label')?.textContent || field || `Bloc ${bIndex + 1}`).trim();
                    blocks.push({
                        id: `blk_${field}`,
                        field,
                        label,
                        format: inferReportFieldFormat(control),
                        controlId: control.id || '',
                        wide: fieldNode.classList.contains('field-wide'),
                        full: fieldNode.classList.contains('field-full'),
                        readonly: Boolean(control.readOnly),
                        required: Boolean(control.required),
                        options: Object.assign({
                            maxLength: control.getAttribute('maxlength') || '',
                            decimals: control.getAttribute('step') && String(control.getAttribute('step')).includes('.') ? String(control.getAttribute('step')).split('.')[1].length : '',
                            regex: control.getAttribute('pattern') || '',
                            placeholder: control.getAttribute('placeholder') || '',
                            values: Array.from(control.options || []).map((opt) => opt.value).filter(Boolean).join('\n'),
                            listSource: inferDropdownListSource(control),
                            valueMode: 'manual',
                            defaultValue: '',
                            lookupSourceTable: 'auditors',
                            lookupMatchReportField: '',
                            lookupMatchTableField: 'name',
                            lookupReturnTableField: 'qualifications'
                        }, inferReportValueOptions(control))
                    });
                } else if (dyn) {
                    const id = dyn.id === 'otherAuditorsList' ? 'special_otherAuditors' : dyn.id === 'otherPeopleList' ? 'special_otherPeople' : 'special_fertilityRows';
                    const label = (fieldNode.querySelector('label')?.textContent || 'Liste dynamique').trim();
                    blocks.push({ id, field: '', label, format: 'special', special: dyn.id, full: true, readonly: true, required: false, options: {} });
                }
            });
            section.querySelectorAll('.report-table input[data-report-field], .report-table textarea[data-report-field], .report-table select[data-report-field]').forEach((control) => {
                const field = control.dataset.reportField;
                if (blocks.some((block) => block.field === field)) return;
                const rowLabel = (control.closest('tr')?.querySelector('td')?.textContent || field).trim();
                let suffix = '';
                const cellIndex = Array.from(control.closest('tr')?.children || []).indexOf(control.closest('td'));
                if (cellIndex === 1) suffix = ' - Porteur';
                if (cellIndex === 2) suffix = ' - Audit';
                if (cellIndex === 3) suffix = ' - Justification';
                blocks.push({
                    id: `blk_${field}`,
                    field,
                    label: `${rowLabel}${suffix}`,
                    format: inferReportFieldFormat(control),
                    controlId: control.id || '',
                    wide: false,
                    full: false,
                    readonly: Boolean(control.readOnly),
                    required: Boolean(control.required),
                    options: {
                        maxLength: control.getAttribute('maxlength') || '',
                        decimals: control.getAttribute('step') && String(control.getAttribute('step')).includes('.') ? String(control.getAttribute('step')).split('.')[1].length : '',
                        regex: control.getAttribute('pattern') || '',
                        placeholder: control.getAttribute('placeholder') || '',
                        values: '',
                        listSource: inferDropdownListSource(control)
                    }
                });
            });
            sections.push({ id: `sec_${sIndex + 1}_${createId()}`, title, blocks });
        });
        return { sections };
    }

    function defaultReportSchema() {
        if (!initialReportSchemaSnapshot) {
            const scanned = buildDefaultReportSchemaFromDom();
            initialReportSchemaSnapshot = scanned.sections.length ? scanned : { sections: [{ id: 'sec_base', title: 'Données de base', blocks: [] }] };
        }
        return cloneReportSchema(initialReportSchemaSnapshot);
    }

    function normalizeReportSchema(schema) {
        const fallback = defaultReportSchema();
        const source = schema && Array.isArray(schema.sections) && schema.sections.length ? schema : fallback;
        const usedFields = new Set();
        const editableSourceSections = source.sections.filter((section) => !isLockedReportSectionTitle(section?.title || ''));
        const sections = editableSourceSections.map((section, sectionIndex) => {
            const blocks = Array.isArray(section.blocks) ? section.blocks.map((block, blockIndex) => {
                const special = String(block.special || '');
                const field = special ? '' : String(block.field || '').trim() || `custom_${createId()}`;
                if (field) usedFields.add(field);
                const rawOptions = block.options || {};
                const hasExplicitValueMode = Object.prototype.hasOwnProperty.call(rawOptions, 'valueMode');
                const options = Object.assign({
                    maxLength: '',
                    decimals: '',
                    regex: '',
                    placeholder: '',
                    values: '',
                    formula: '',
                    listSource: 'manual',
                    valueMode: 'manual',
                    defaultValue: '',
                    lookupSourceTable: 'auditors',
                    lookupMatchReportField: '',
                    lookupMatchTableField: 'name',
                    lookupReturnTableField: 'qualifications'
                }, rawOptions);
                const normalizedFormat = REPORT_FIELD_FORMATS.some(([key]) => key === block.format) ? block.format : (special ? 'special' : 'text');
                if (field === 'base_organization') {
                    if (!options.defaultValue) options.defaultValue = 'Control Union Inspections France';
                    if (!hasExplicitValueMode || !options.valueMode) options.valueMode = 'fixed';
                    options.systemStyle = options.systemStyle === false ? false : true;
                }
                if (field === 'base_auditEndDate') {
                    options.valueMode = 'calculated';
                    options.systemStyle = true;
                }
                if (field === 'base_qualifications') {
                    if (!hasExplicitValueMode || !options.valueMode) options.valueMode = 'lookup';
                    if (!options.lookupSourceTable) options.lookupSourceTable = 'auditors';
                    if (!options.lookupMatchReportField) options.lookupMatchReportField = 'base_leadAuditor';
                    if (!options.lookupMatchTableField) options.lookupMatchTableField = 'name';
                    if (!options.lookupReturnTableField) options.lookupReturnTableField = 'qualifications';
                    options.systemStyle = options.systemStyle === false ? false : true;
                }
                if (!REPORT_VALUE_MODES.some(([key]) => key === options.valueMode)) options.valueMode = normalizedFormat === 'calculated' ? 'calculated' : 'manual';
                const readonlyByMode = ['fixed', 'lookup', 'calculated'].includes(options.valueMode);
                return {
                    id: String(block.id || `blk_${field || blockIndex}_${createId()}`),
                    field,
                    label: String(block.label || field || `Bloc ${blockIndex + 1}`).trim(),
                    format: normalizedFormat,
                    special,
                    controlId: String(block.controlId || ''),
                    wide: Boolean(block.wide),
                    full: Boolean(block.full),
                    readonly: Boolean(block.readonly || block.format === 'calculated' || readonlyByMode),
                    required: Boolean(block.required),
                    systemStyle: Boolean(block.systemStyle || options.systemStyle || block.readonly || readonlyByMode),
                    options
                };
            }) : [];
            return { id: String(section.id || `sec_${sectionIndex + 1}_${createId()}`), title: String(section.title || `Section ${sectionIndex + 1}`).trim(), blocks };
        });
        return { sections };
    }

    function reportSchema() {
        ensureAdminDataShape();
        appState.admin.reportSchema = normalizeReportSchema(appState.admin.reportSchema);
        if (!selectedReportSectionId && appState.admin.reportSchema.sections[0]) selectedReportSectionId = appState.admin.reportSchema.sections[0].id;
        if (!appState.admin.reportSchema.sections.some((section) => section.id === selectedReportSectionId) && appState.admin.reportSchema.sections[0]) selectedReportSectionId = appState.admin.reportSchema.sections[0].id;
        return appState.admin.reportSchema;
    }

    function getReportValueMode(block) {
        return String((block && block.options && block.options.valueMode) || 'manual');
    }

    function isReportBlockReadonly(block) {
        const mode = getReportValueMode(block);
        return Boolean(block && (block.readonly || block.format === 'calculated' || ['fixed', 'lookup', 'calculated'].includes(mode)));
    }

    function allReportSchemaBlocks() {
        const schema = appState && appState.admin && appState.admin.reportSchema;
        if (!schema || !Array.isArray(schema.sections)) return [];
        return schema.sections.flatMap((section) => Array.isArray(section.blocks) ? section.blocks : []);
    }

    function getAdminLookupRows(sourceTable) {
        ensureAdminDataShape();
        if (sourceTable === 'auditors') return getActiveAuditors();
        if (sourceTable === 'methods') return appState.admin.methods || [];
        if (sourceTable === 'lbcProjects') return appState.admin.lbcProjects || [];
        return [];
    }

    function getReportLookupValue(block, reportData) {
        if (!block || !block.field) return '';
        const options = block.options || {};
        const rows = getAdminLookupRows(String(options.lookupSourceTable || 'auditors'));
        const matchReportField = String(options.lookupMatchReportField || '');
        const matchTableField = String(options.lookupMatchTableField || 'name');
        const returnTableField = String(options.lookupReturnTableField || 'qualifications');
        const matchValue = String((reportData || {})[matchReportField] || '').trim();
        if (!matchValue || !matchTableField || !returnTableField) return '';
        const row = rows.find((item) => String(item && item[matchTableField] || '').trim() === matchValue);
        return row ? String(row[returnTableField] ?? '') : '';
    }

    function applyReportValueRules(reportData) {
        if (!reportData) return reportData;
        allReportSchemaBlocks().forEach((block) => {
            if (!block || !block.field || block.special) return;
            const options = block.options || {};
            const mode = getReportValueMode(block);
            if (mode === 'default' && !String(reportData[block.field] || '').trim()) {
                reportData[block.field] = options.defaultValue || '';
            } else if (mode === 'fixed') {
                reportData[block.field] = options.defaultValue || '';
            } else if (mode === 'lookup') {
                reportData[block.field] = getReportLookupValue(block, reportData);
            }
        });
        return reportData;
    }

    function reflectReportConfiguredValuesToDom(reportData) {
        if (!reportData) return;
        document.querySelectorAll('[data-report-field]').forEach((field) => {
            const block = findReportSchemaBlockForElement(field);
            if (!block) return;
            const mode = getReportValueMode(block);
            const shouldReflect = ['default', 'fixed', 'lookup', 'calculated'].includes(mode);
            if (!shouldReflect) return;
            const key = field.dataset.reportField;
            const value = reportData[key] ?? '';
            if (field.value !== value) field.value = value;
        });
    }

    function optionTags(options, selected) {
        const selectedValue = String(selected || '');
        return (options || []).map(([value, label]) => `<option value="${escapeHtml(value)}" ${String(value) === selectedValue ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    }

    function getReportValueModeOptionsHtml(selected) {
        return optionTags(REPORT_VALUE_MODES, selected || 'manual');
    }

    function getLookupTableOptionsHtml(selected) {
        return optionTags(REPORT_LOOKUP_TABLES, selected || 'auditors');
    }

    function getLookupFieldOptionsHtml(sourceTable, selected) {
        const source = String(sourceTable || 'auditors');
        return optionTags(REPORT_LOOKUP_FIELDS[source] || REPORT_LOOKUP_FIELDS.auditors, selected || '');
    }

    function getReportFieldOptionsHtml(selected, currentField) {
        const selectedValue = String(selected || '');
        const rows = allReportSchemaBlocks()
            .filter((block) => block && block.field && !block.special && block.field !== currentField)
            .map((block) => [block.field, `${block.label || block.field} (${block.field})`]);
        const placeholder = `<option value="" ${selectedValue ? '' : 'selected'}>Sélectionner un champ du Rapport</option>`;
        return placeholder + rows.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    }

    function getReportDropdownValues(block) {
        const options = block.options || {};
        const source = String(options.listSource || 'manual');
        ensureAdminDataShape();
        if (source === 'manual') return String(options.values || '').split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
        if (source === 'auditors') return getActiveAuditors().map((a) => a.name).filter(Boolean);
        if (source === 'auditorStatuses') return appState.admin.auditorStatuses || [];
        if (source === 'civilities') return appState.admin.civilities || [];
        if (source === 'auditTypes') return appState.admin.auditTypes || [];
        if (source === 'methods') return uniqueValues((appState.admin.methods || []).map((m) => m.method));
        if (source === 'methodVersions') return uniqueValues((appState.admin.methods || []).map((m) => m.version));
        if (source === 'species') return appState.admin.species || [];
        if (source === 'lbcProjects') return uniqueValues((appState.admin.lbcProjects || []).map((p) => p.name || p.reference));
        if (source.startsWith('custom:')) {
            const id = source.slice('custom:'.length);
            const custom = (appState.admin.customLists || []).find((list) => list.id === id);
            return custom ? custom.values || [] : [];
        }
        return [];
    }


    function findReportSchemaBlock(controlId, fieldName) {
        const schema = appState && appState.admin && appState.admin.reportSchema;
        const id = String(controlId || '');
        const field = String(fieldName || '');
        if (!schema || !Array.isArray(schema.sections)) return null;
        for (const section of schema.sections) {
            for (const block of (section.blocks || [])) {
                if (id && block.controlId === id) return block;
                if (field && block.field === field) return block;
            }
        }
        return null;
    }

    function findReportSchemaBlockForElement(element) {
        if (!element) return null;
        return findReportSchemaBlock(element.id, element.dataset ? element.dataset.reportField : '');
    }

    function getReportSchemaBlockListSource(element, fallbackSource) {
        const block = findReportSchemaBlockForElement(element);
        if (!block || block.format !== 'dropdown') return fallbackSource || 'manual';
        return String((block.options || {}).listSource || fallbackSource || 'manual');
    }

    function populateReportSchemaSelect(select, fallbackValues, placeholder) {
        if (!select) return;
        const block = findReportSchemaBlockForElement(select);
        if (block && block.format === 'dropdown') {
            fillSelect(select, getReportDropdownValues(block), placeholder);
            return;
        }
        fillSelect(select, fallbackValues, placeholder);
    }

    function getReportDropdownSourceOptionsHtml(selected) {
        const selectedValue = String(selected || 'manual');
        const baseOptions = REPORT_DROPDOWN_SOURCES.map(([value, label]) => `<option value="${escapeHtml(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
        const customLists = appState.admin && Array.isArray(appState.admin.customLists) ? appState.admin.customLists : [];
        const customOptions = customLists.map((list) => {
            const value = `custom:${list.id}`;
            return `<option value="${escapeHtml(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHtml(list.name || 'Liste personnalisée')}</option>`;
        }).join('');
        const missingSelected = selectedValue.startsWith('custom:') && !customLists.some((list) => `custom:${list.id}` === selectedValue)
            ? `<option value="${escapeHtml(selectedValue)}" selected>Liste personnalisée supprimée</option>`
            : '';
        return `${baseOptions}${customOptions ? `<optgroup label="Listes personnalisées">${customOptions}</optgroup>` : ''}${missingSelected}`;
    }

    function refreshReportAfterAdminListChange() {
        renderReportSchema();
        cacheReportElements();
        syncReportFormFromState();
    }

    function reportInputAttributes(block) {
        const options = block.options || {};
        const attrs = [];
        const classes = [];
        const readonly = isReportBlockReadonly(block);
        if (block.controlId) attrs.push(`id="${escapeHtml(block.controlId)}"`);
        if (block.controlId === 'lbcProjectName') attrs.push('list="lbcProjectsDatalist"');
        if (block.field === 'client_city') attrs.push('list="clientCityDatalist"');
        if (block.field === 'project_city') attrs.push('list="projectCityDatalist"');
        attrs.push(`data-report-field="${escapeHtml(block.field)}"`);
        if (readonly && block.format !== 'dropdown') attrs.push('readonly');
        if (readonly && block.format === 'dropdown') attrs.push('disabled');
        if (readonly || block.systemStyle || options.systemStyle) classes.push('summary-readonly');
        if (classes.length) attrs.push(`class="${classes.join(' ')}"`);
        if (block.required) attrs.push('required');
        if (options.maxLength) attrs.push(`maxlength="${escapeHtml(options.maxLength)}"`);
        if (options.regex) attrs.push(`pattern="${escapeHtml(options.regex)}"`);
        if (options.placeholder) attrs.push(`placeholder="${escapeHtml(options.placeholder)}"`);
        return attrs.join(' ');
    }

    function renderReportBlockControl(block) {
        if (block.special === 'otherAuditorsList') return '<div id="otherAuditorsList" class="dynamic-list"></div><button id="addOtherAuditor" class="inline-add-button" type="button">+ Ajouter un auditeur</button>';
        if (block.special === 'otherPeopleList') return '<div id="otherPeopleList" class="dynamic-list"></div><button id="addOtherPerson" class="inline-add-button" type="button">+ Ajouter une personne</button>';
        if (block.special === 'fertilityRows') return '<div id="fertilityRows" class="dynamic-list fertility-list"></div><button id="addFertilityRow" class="inline-add-button" type="button">+ Ajouter une essence</button>';
        const attrs = reportInputAttributes(block);
        if (block.format === 'textarea') return `<textarea ${attrs} rows="4"></textarea>`;
        if (block.format === 'dropdown') {
            const values = getReportDropdownValues(block);
            return `<select ${attrs}><option value="">Sélectionner</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}</select>`;
        }
        const decimals = Math.max(0, Number((block.options || {}).decimals || 0));
        const type = block.format === 'date' ? 'date' : block.format === 'email' ? 'email' : ['integer', 'decimal', 'percentage'].includes(block.format) ? 'number' : 'text';
        const step = block.format === 'integer' ? '1' : ['decimal', 'percentage'].includes(block.format) ? (decimals ? String(1 / Math.pow(10, decimals)) : '0.01') : '';
        const inputMode = ['integer'].includes(block.format) ? 'numeric' : ['decimal', 'percentage'].includes(block.format) ? 'decimal' : '';
        return `<input ${attrs} type="${type}" ${step ? `step="${step}"` : ''} ${inputMode ? `inputmode="${inputMode}"` : ''} autocomplete="off">`;
    }

    function renderReportSchema() {
        const form = $('reportForm');
        if (!form || !appState || !appState.admin) return;
        const schema = reportSchema();
        const editableSectionsHtml = schema.sections.map((section) => `
            <section class="report-section" data-report-section-id="${escapeHtml(section.id)}">
                <h3>${escapeHtml(section.title)}</h3>
                <div class="report-grid cols-4">
                    ${(section.blocks || []).map((block) => `
                        <div class="field ${block.wide ? 'field-wide' : ''} ${block.full ? 'field-full' : ''}" data-report-block-id="${escapeHtml(block.id)}">
                            <label>${escapeHtml(block.label)}</label>
                            ${renderReportBlockControl(block)}
                        </div>
                    `).join('')}
                </div>
            </section>
        `).join('');
        form.innerHTML = `${editableSectionsHtml}${getLockedReportSectionsHtml()}`;
        if (!document.getElementById('lbcProjectsDatalist')) {
            const list = document.createElement('datalist');
            list.id = 'lbcProjectsDatalist';
            document.body.appendChild(list);
        }
        ['clientCityDatalist', 'projectCityDatalist'].forEach((id) => {
            if (!document.getElementById(id)) {
                const list = document.createElement('datalist');
                list.id = id;
                document.body.appendChild(list);
            }
        });
        cacheReportElements();
        refreshPostalCityOptions('client');
        refreshPostalCityOptions('project');
    }

    function formatLabel(format) {
        return (REPORT_FIELD_FORMATS.find(([key]) => key === format) || [format, format])[1];
    }

    function reportFormatHelp(format) {
        const help = {
            text: 'Pour une réponse courte sur une seule ligne.',
            integer: 'Pour un nombre sans virgule, par exemple 12.',
            decimal: 'Pour un nombre avec virgule. Le nombre de décimales est réglable.',
            percentage: 'Pour un taux ou un pourcentage.',
            date: 'Pour sélectionner une date dans le calendrier.',
            dropdown: 'Pour proposer une liste de choix.',
            calculated: 'Pour une valeur remplie automatiquement par l’application.',
            textarea: 'Pour un commentaire ou une réponse longue.',
            email: 'Pour une adresse e-mail.'
        };
        return help[format] || '';
    }

    function reportValueModeHelp(mode) {
        const help = {
            manual: 'L’utilisateur saisit librement la valeur dans le Rapport.',
            default: 'Le champ est prérempli, mais l’utilisateur peut le modifier.',
            fixed: 'La valeur est imposée et ne peut pas être modifiée dans le Rapport.',
            lookup: 'La valeur est cherchée automatiquement dans une table Admin, par exemple la qualification liée à l’auditeur choisi.',
            calculated: 'La valeur est produite par une règle ou un calcul de l’application.'
        };
        return help[mode] || '';
    }

    function reportAdminOption(label, controlHtml, helpText = '', className = '') {
        const classAttr = className ? ` class="${escapeHtml(className)}"` : '';
        return `<label${classAttr}><span>${escapeHtml(label)}</span>${controlHtml}${helpText ? `<small>${escapeHtml(helpText)}</small>` : ''}</label>`;
    }

    function renderReportBlockAdminOptions(block, index) {
        const options = block.options || {};
        const format = String(block.format || 'text');
        const mode = getReportValueMode(block);
        const listSource = String(options.listSource || 'manual');
        const showDefaultValue = ['default', 'fixed'].includes(mode);
        const showLookup = mode === 'lookup';
        const showDropdown = format === 'dropdown';
        const showDecimals = ['decimal', 'percentage'].includes(format);
        const showTextValidation = ['text', 'email'].includes(format);
        const showFormula = mode === 'calculated' || format === 'calculated';
        const valueLabel = mode === 'fixed' ? 'Valeur à imposer' : 'Valeur de départ';
        const valueHelp = mode === 'fixed'
            ? 'Cette valeur sera toujours utilisée dans le Rapport.'
            : 'Cette valeur sera utilisée uniquement si le champ est vide.';
        const parts = [];
        parts.push(`
            <div class="report-schema-option-group report-schema-option-group-full">
                <h5>Comprendre ce bloc</h5>
                <p class="admin-help-text">${escapeHtml(reportFormatHelp(format))} ${escapeHtml(reportValueModeHelp(mode))}</p>
            </div>
        `);
        parts.push(`
            <div class="report-schema-option-group report-schema-option-group-full">
                <h5>Remplissage du champ</h5>
                ${reportAdminOption('Comment ce champ est-il rempli ?', `<select data-report-block-option="valueMode" data-block-index="${index}">${getReportValueModeOptionsHtml(mode)}</select>`, 'Choisis si la valeur est saisie, préremplie, imposée ou récupérée automatiquement.', 'report-option-wide')}
                ${showDefaultValue ? reportAdminOption(valueLabel, `<input data-report-block-option="defaultValue" data-block-index="${index}" value="${escapeHtml(options.defaultValue || '')}" placeholder="Ex : Control Union Inspections France">`, valueHelp, 'report-option-wide') : ''}
            </div>
        `);
        if (showLookup) {
            parts.push(`
                <div class="report-schema-option-group report-schema-option-group-full">
                    <h5>Liaison avec une table Admin</h5>
                    <p class="admin-help-text">Exemple : prendre l’auditeur principal du Rapport, le chercher dans la table des auditeurs, puis copier sa qualification.</p>
                    ${reportAdminOption('Où chercher l’information ?', `<select data-report-block-option="lookupSourceTable" data-block-index="${index}">${getLookupTableOptionsHtml(options.lookupSourceTable || 'auditors')}</select>`, 'Table Admin utilisée comme source.')}
                    ${reportAdminOption('Quel champ du Rapport sert de référence ?', `<select data-report-block-option="lookupMatchReportField" data-block-index="${index}">${getReportFieldOptionsHtml(options.lookupMatchReportField || '', block.field)}</select>`, 'Exemple : Auditeur principal.')}
                    ${reportAdminOption('Quelle colonne doit correspondre ?', `<select data-report-block-option="lookupMatchTableField" data-block-index="${index}">${getLookupFieldOptionsHtml(options.lookupSourceTable || 'auditors', options.lookupMatchTableField || 'name')}</select>`, 'Exemple : Nom de l’auditeur.')}
                    ${reportAdminOption('Quelle colonne recopier dans ce bloc ?', `<select data-report-block-option="lookupReturnTableField" data-block-index="${index}">${getLookupFieldOptionsHtml(options.lookupSourceTable || 'auditors', options.lookupReturnTableField || 'qualifications')}</select>`, 'Exemple : Qualifications / statut.')}
                </div>
            `);
        }
        if (showDropdown) {
            parts.push(`
                <div class="report-schema-option-group report-schema-option-group-full">
                    <h5>Choix proposés dans la liste</h5>
                    ${reportAdminOption('D’où viennent les choix ?', `<select data-report-block-option="listSource" data-block-index="${index}">${getReportDropdownSourceOptionsHtml(listSource)}</select>`, 'Tu peux saisir une liste ici ou réutiliser une liste existante de l’Admin.', 'report-option-wide')}
                    ${reportAdminOption('Choix saisis manuellement', `<textarea data-report-block-option="values" data-block-index="${index}" rows="3" placeholder="Une option par ligne" ${listSource !== 'manual' ? 'disabled' : ''}>${escapeHtml(options.values || '')}</textarea>`, listSource === 'manual' ? 'Écris une option par ligne.' : 'Désactivé, car ce bloc utilise une source de liste dynamique.', 'report-option-wide')}
                </div>
            `);
        }
        parts.push(`
            <div class="report-schema-option-group report-schema-option-group-full">
                <h5>Règles et présentation</h5>
                ${reportAdminOption('Texte d’aide dans le champ', `<input data-report-block-option="placeholder" data-block-index="${index}" value="${escapeHtml(options.placeholder || '')}" placeholder="Ex : 6 chiffres">`, 'Texte affiché dans le champ avant saisie.')}
                ${showTextValidation ? reportAdminOption('Longueur maximale', `<input data-report-block-option="maxLength" data-block-index="${index}" value="${escapeHtml(options.maxLength || '')}" inputmode="numeric" placeholder="Ex : 6">`, 'Laisse vide pour ne pas limiter.') : ''}
                ${showDecimals ? reportAdminOption('Nombre de décimales', `<input data-report-block-option="decimals" data-block-index="${index}" value="${escapeHtml(options.decimals || '')}" inputmode="numeric" placeholder="Ex : 2">`, 'Contrôle la précision affichée et saisie.') : ''}
                ${showFormula ? reportAdminOption('Explication du calcul', `<input data-report-block-option="formula" data-block-index="${index}" value="${escapeHtml(options.formula || '')}" placeholder="Ex : calculé depuis la synthèse">`, 'Note interne pour expliquer d’où vient la valeur.', 'report-option-wide') : ''}
                ${reportAdminOption('Règle avancée de validation', `<input data-report-block-option="regex" data-block-index="${index}" value="${escapeHtml(options.regex || '')}" placeholder="Ex : \\d{6}">`, 'Option avancée : motif technique de contrôle, à laisser vide en cas de doute.', 'report-option-wide')}
                <label class="admin-checkbox-inline"><input type="checkbox" data-report-block-field="required" data-block-index="${index}" ${block.required ? 'checked' : ''}> L’utilisateur doit renseigner ce champ</label>
                <label class="admin-checkbox-inline"><input type="checkbox" data-report-block-field="readonly" data-block-index="${index}" ${block.readonly ? 'checked' : ''}> Empêcher la modification dans le Rapport</label>
                <label class="admin-checkbox-inline"><input type="checkbox" data-report-block-field="systemStyle" data-block-index="${index}" ${block.systemStyle ? 'checked' : ''}> Afficher comme champ système bleu</label>
                <label class="admin-checkbox-inline"><input type="checkbox" data-report-block-field="wide" data-block-index="${index}" ${block.wide ? 'checked' : ''}> Occuper deux colonnes</label>
                <label class="admin-checkbox-inline"><input type="checkbox" data-report-block-field="full" data-block-index="${index}" ${block.full ? 'checked' : ''}> Occuper toute la ligne</label>
            </div>
        `);
        parts.push(`
            <div class="report-schema-option-group report-schema-option-group-full report-schema-advanced">
                <h5>Paramètre avancé</h5>
                ${reportAdminOption('Nom interne du champ', `<input data-report-block-field="field" data-block-index="${index}" value="${escapeHtml(block.field)}" placeholder="ex: base_numero">`, 'Identifiant utilisé pour enregistrer les données. À modifier seulement si nécessaire.', 'report-option-wide')}
            </div>
        `);
        return `<div class="report-schema-options">${parts.join('')}</div>`;
    }

    function renderAdminReportSchema() {
        if (!els.adminReportSections || !els.adminReportBlocks) return;
        const schema = reportSchema();
        els.adminReportSections.innerHTML = schema.sections.map((section, index) => `
            <div class="report-schema-row ${section.id === selectedReportSectionId ? 'active' : ''}" draggable="true" data-report-section-row="${index}" data-report-section-select="${escapeHtml(section.id)}">
                <span class="admin-drag-cell">☰</span>
                <strong>${index + 1}</strong>
                <input data-report-section-field="title" data-section-index="${index}" value="${escapeHtml(section.title)}" placeholder="Nom de section">
                <span class="report-schema-count">${(section.blocks || []).length} bloc${(section.blocks || []).length > 1 ? 's' : ''}</span>
                <button class="small-danger-button" type="button" data-report-section-delete="${index}">×</button>
            </div>
        `).join('');
        const sectionIndex = schema.sections.findIndex((section) => section.id === selectedReportSectionId);
        const section = schema.sections[sectionIndex] || schema.sections[0];
        if (els.adminReportEditTitle) els.adminReportEditTitle.textContent = section ? `ÉDITION : ${section.title}` : 'ÉDITION';
        if (!section) { els.adminReportBlocks.innerHTML = '<p class="dynamic-empty">Aucune section.</p>'; return; }
        els.adminReportBlocks.innerHTML = (section.blocks || []).map((block, index) => `
            <div class="report-schema-block" draggable="true" data-report-block-row="${index}">
                <div class="report-schema-block-main">
                    <span class="admin-drag-cell">☰</span>
                    <strong>${index + 1}</strong>
                    <input data-report-block-field="label" data-block-index="${index}" value="${escapeHtml(block.label)}" placeholder="Libellé du bloc">
                    <select data-report-block-field="format" data-block-index="${index}" ${block.special ? 'disabled' : ''}>
                        ${REPORT_FIELD_FORMATS.map(([key, label]) => `<option value="${key}" ${block.format === key ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}
                    </select>
                    <button class="small-danger-button" type="button" data-report-block-delete="${index}">×</button>
                </div>
                ${block.special ? '<p class="admin-help-text">Bloc automatique de l’application. Il peut être déplacé ou supprimé, mais ses réglages internes ne sont pas modifiables ici.</p>' : renderReportBlockAdminOptions(block, index)}
            </div>
        `).join('') || '<p class="dynamic-empty">Aucun bloc dans cette section.</p>';
    }

    function selectedReportSection() {
        const schema = reportSchema();
        return schema.sections.find((section) => section.id === selectedReportSectionId) || schema.sections[0];
    }

    function applyReportSchemaChange(repaintAdmin = true) {
        appState.admin.reportSchema = normalizeReportSchema(appState.admin.reportSchema);
        renderReportSchema();
        cacheReportElements();
        populateReportControls();
        syncReportFormFromState();
        if (repaintAdmin) renderAdminReportSchema();
        persist();
    }

    function handleReportSchemaAdminClick(event) {
        const select = event.target.closest('[data-report-section-select]');
        if (select && !event.target.matches('input, button')) {
            selectedReportSectionId = select.dataset.reportSectionSelect;
            renderAdminReportSchema();
            return true;
        }
        if (event.target.closest('[data-report-section-add]')) {
            const schema = reportSchema();
            const section = { id: `sec_${createId()}`, title: 'Nouvelle section', blocks: [] };
            schema.sections.push(section);
            selectedReportSectionId = section.id;
            applyReportSchemaChange();
            return true;
        }
        const deleteSection = event.target.closest('[data-report-section-delete]');
        if (deleteSection) {
            const index = Number(deleteSection.dataset.reportSectionDelete);
            const schema = reportSchema();
            if (schema.sections.length <= 1) { showToast('Le rapport doit conserver au moins une section.'); return true; }
            schema.sections.splice(index, 1);
            selectedReportSectionId = schema.sections[Math.max(0, index - 1)]?.id || schema.sections[0]?.id || '';
            applyReportSchemaChange();
            return true;
        }
        if (event.target.closest('[data-report-block-add]')) {
            const section = selectedReportSection();
            if (!section) return true;
            const id = createId();
            section.blocks.push({ id: `blk_${id}`, field: `custom_${id}`, label: 'Nouveau bloc', format: 'text', wide: false, full: false, readonly: false, required: false, systemStyle: false, options: { maxLength: '', decimals: '', regex: '', placeholder: '', values: '', formula: '', listSource: 'manual', valueMode: 'manual', defaultValue: '', lookupSourceTable: 'auditors', lookupMatchReportField: '', lookupMatchTableField: 'name', lookupReturnTableField: 'qualifications' } });
            applyReportSchemaChange();
            return true;
        }
        const deleteBlock = event.target.closest('[data-report-block-delete]');
        if (deleteBlock) {
            const section = selectedReportSection();
            if (!section) return true;
            section.blocks.splice(Number(deleteBlock.dataset.reportBlockDelete), 1);
            applyReportSchemaChange();
            return true;
        }
        return false;
    }

    function handleReportSchemaAdminInput(event) {
        const sectionField = event.target.closest('[data-report-section-field]');
        if (sectionField) {
            const schema = reportSchema();
            const section = schema.sections[Number(sectionField.dataset.sectionIndex)];
            if (section) section.title = sectionField.value;
            applyReportSchemaChange(event.type === 'change');
            return true;
        }
        const blockField = event.target.closest('[data-report-block-field]');
        const blockOption = event.target.closest('[data-report-block-option]');
        if (!blockField && !blockOption) return false;
        const section = selectedReportSection();
        const index = Number((blockField || blockOption).dataset.blockIndex);
        const block = section && section.blocks[index];
        if (!block) return true;
        if (blockField) {
            const name = blockField.dataset.reportBlockField;
            if (blockField.type === 'checkbox') block[name] = blockField.checked;
            else block[name] = blockField.value;
            if (name === 'format' && block.format === 'calculated') {
                block.readonly = true;
                block.options = block.options || {};
                block.options.valueMode = 'calculated';
                block.systemStyle = true;
            }
            if (name === 'field') block.field = String(block.field || '').trim().replace(/[^a-zA-Z0-9_]/g, '_') || `custom_${createId()}`;
        } else if (blockOption) {
            block.options = block.options || {};
            const optionName = blockOption.dataset.reportBlockOption;
            block.options[optionName] = blockOption.value;
            if (optionName === 'valueMode') {
                if (['fixed', 'lookup', 'calculated'].includes(blockOption.value)) {
                    block.readonly = true;
                    block.systemStyle = true;
                } else if (['manual', 'default'].includes(blockOption.value)) {
                    block.readonly = false;
                }
            }
            if (optionName === 'lookupSourceTable') {
                const fields = REPORT_LOOKUP_FIELDS[blockOption.value] || REPORT_LOOKUP_FIELDS.auditors;
                block.options.lookupMatchTableField = fields[0]?.[0] || '';
                block.options.lookupReturnTableField = fields[1]?.[0] || fields[0]?.[0] || '';
            }
        }
        applyReportSchemaChange(event.type === 'change');
        return true;
    }

    function handleReportSectionDragStart(event) {
        const row = event.target.closest('[data-report-section-row]');
        if (!row) return;
        draggedReportSectionIndex = Number(row.dataset.reportSectionRow);
        row.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
    }

    function handleReportSectionDragOver(event) {
        const row = event.target.closest('[data-report-section-row]');
        if (!row || draggedReportSectionIndex === null) return;
        event.preventDefault();
        row.classList.add('drag-over');
    }

    function handleReportSectionDrop(event) {
        const row = event.target.closest('[data-report-section-row]');
        if (!row || draggedReportSectionIndex === null) return;
        event.preventDefault();
        const targetIndex = Number(row.dataset.reportSectionRow);
        const schema = reportSchema();
        const [moved] = schema.sections.splice(draggedReportSectionIndex, 1);
        schema.sections.splice(targetIndex, 0, moved);
        selectedReportSectionId = moved.id;
        applyReportSchemaChange();
    }

    function handleReportBlockDragStart(event) {
        const row = event.target.closest('[data-report-block-row]');
        if (!row) return;
        draggedReportBlockIndex = Number(row.dataset.reportBlockRow);
        row.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
    }

    function handleReportBlockDragOver(event) {
        const row = event.target.closest('[data-report-block-row]');
        if (!row || draggedReportBlockIndex === null) return;
        event.preventDefault();
        row.classList.add('drag-over');
    }

    function handleReportBlockDrop(event) {
        const row = event.target.closest('[data-report-block-row]');
        if (!row || draggedReportBlockIndex === null) return;
        event.preventDefault();
        const targetIndex = Number(row.dataset.reportBlockRow);
        const section = selectedReportSection();
        if (!section) return;
        const [moved] = section.blocks.splice(draggedReportBlockIndex, 1);
        section.blocks.splice(targetIndex, 0, moved);
        applyReportSchemaChange();
    }

    function handleReportSchemaDragEnd() {
        draggedReportSectionIndex = null;
        draggedReportBlockIndex = null;
        document.querySelectorAll('.report-schema-row.dragging, .report-schema-row.drag-over, .report-schema-block.dragging, .report-schema-block.drag-over').forEach((el) => el.classList.remove('dragging', 'drag-over'));
    }

    function renderAdmin() {
        ensureAdminDataShape();
        if (!els.adminPanel) return;
        renderAdminUsers();
        renderAdminAuditors();
        renderSingleColumnAdmin('auditorStatuses', els.adminStatusesBody, 'Statut');
        renderSingleColumnAdmin('civilities', els.adminCivilitiesBody, 'Civilité');
        renderSingleColumnAdmin('auditTypes', els.adminAuditTypesBody, "Type d'audit");
        renderAdminMethods();
        renderSingleColumnAdmin('species', els.adminSpeciesBody, 'Essence');
        renderAdminCustomLists();
        renderAdminChecklist();
        renderAdminCobenefits();
        renderAdminCobenefitMaxPoints();
        renderAdminRegistry();
        renderAdminTabOrder();
        renderAdminChecklistCobenefitMatrix();
        renderAdminReportSchema();
    }


    function renderAdminTabOrder() {
        const body = document.getElementById('adminTabOrderBody');
        if (!body) return;
        appState.admin.tabOrder = normalizeTabOrder(appState.admin.tabOrder);
        body.innerHTML = appState.admin.tabOrder.map((tabId, index) => {
            const tab = getMainTabDefinition(tabId);
            return `
                <tr draggable="true" data-tab-order-row="${index}" class="admin-draggable-row">
                    <td class="drag-handle">≡</td>
                    <td>${escapeHtml(tab.label)}</td>
                    <td class="admin-center-cell">
                        <button class="mini-button" type="button" data-tab-order-move="up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button class="mini-button" type="button" data-tab-order-move="down" data-index="${index}" ${index === appState.admin.tabOrder.length - 1 ? 'disabled' : ''}>↓</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderAdminChecklistCobenefitMatrix() {
        const head = document.getElementById('adminChecklistCobenefitMatrixHead');
        const body = document.getElementById('adminChecklistCobenefitMatrixBody');
        if (!head || !body) return;
        appState.admin.checklistCobenefitMatrix = normalizeChecklistCobenefitMatrix(appState.admin.checklistCobenefitMatrix || {});
        const rows = getChecklistCobenefitRows();
        const groups = getAdminCobenefitGroupsForMatrix();
        if (!rows.length || !groups.length) {
            head.innerHTML = '<tr><th>Question checklist</th><th>Co-bénéfices</th></tr>';
            body.innerHTML = '<tr><td colspan="2"><p class="dynamic-empty">Ajoute au moins une question Checklist dans les catégories Audit terrain / Co-bénéfices et au moins un co-bénéfice.</p></td></tr>';
            return;
        }
        head.innerHTML = `<tr><th>Question Checklist</th>${groups.map((group) => `<th title="${escapeHtml(group.category)}">${escapeHtml(group.title)}</th>`).join('')}</tr>`;
        body.innerHTML = rows.map((item) => `
            <tr>
                <td><strong>${escapeHtml(item.number || '')}</strong> ${escapeHtml(item.title || '')}<br><small>${escapeHtml(item.category || '')}</small></td>
                ${groups.map((group) => {
                    const checked = Boolean(appState.admin.checklistCobenefitMatrix[item.id] && appState.admin.checklistCobenefitMatrix[item.id][group.id]);
                    return `<td class="admin-center-cell"><input type="checkbox" data-checklist-cobenefit-link data-checklist-id="${escapeHtml(item.id)}" data-cobenefit-id="${escapeHtml(group.id)}" ${checked ? 'checked' : ''} title="Alerter si ce co-bénéfice est demandé et que cette question n’est pas auditée"></td>`;
                }).join('')}
            </tr>
        `).join('');
    }

    function renderAdminUsers() {
        // Depuis la v3.28.13, les accès sont fusionnés avec la table Auditeurs.
        if (!els.adminUsersBody) return;
        els.adminUsersBody.innerHTML = '';
    }

    function renderAdminCustomLists() {
        if (!els.adminCustomListsBody) return;
        ensureAdminDataShape();
        els.adminCustomListsBody.innerHTML = (appState.admin.customLists || []).map((list, index) => `
            <tr>
                <td><input data-admin-list="customLists" data-index="${index}" data-field="name" value="${escapeHtml(list.name || '')}" placeholder="Nom de la liste"></td>
                <td><textarea data-admin-list="customLists" data-index="${index}" data-field="values" rows="3" placeholder="Une valeur par ligne">${escapeHtml((list.values || []).join('\n'))}</textarea></td>
                <td><button class="small-danger-button" type="button" data-admin-remove="customLists" data-index="${index}">×</button></td>
            </tr>
        `).join('') || '<tr><td colspan="3"><p class="dynamic-empty">Aucune liste personnalisée.</p></td></tr>';
    }

    function renderAdminAuditors() {
        if (!els.adminAuditorsBody) return;
        ensureAdminDataShape();
        const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
        els.adminAuditorsBody.innerHTML = (appState.admin.auditors || []).map((row, index) => {
            const locked = isAdminRowLocked('auditors', index, row);
            const role = ROLE_LABELS[row.role] ? row.role : 'auditor';
            const active = row.active !== false;
            const rightsSummary = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.auditor;
            const rightsLabel = [
                rightsSummary.canAccessAdmin ? 'Admin' : '',
                rightsSummary.canEditAudit ? 'Édition audit' : 'Lecture seule',
                rightsSummary.canExportPdf ? 'Export PDF' : '',
                rightsSummary.canAccessFinalSection ? 'Future section' : ''
            ].filter(Boolean).join(' · ');
            return `
            <tr class="${locked ? 'admin-row-locked' : ''} ${!active ? 'admin-row-disabled' : ''}">
                <td><input data-admin-list="auditors" data-index="${index}" data-field="name" value="${escapeHtml(row.name || '')}" placeholder="Nom complet"></td>
                <td><input data-admin-list="auditors" data-index="${index}" data-field="email" type="email" value="${escapeHtml(row.email || '')}" placeholder="email@controlunion.com"></td>
                <td><input data-admin-list="auditors" data-index="${index}" data-field="password" type="text" value="${escapeHtml(row.password || '')}" placeholder="Mot de passe"></td>
                <td><input data-admin-list="auditors" data-index="${index}" data-field="qualifications" value="${escapeHtml(row.qualifications || '')}" placeholder="Statut / qualification"></td>
                <td><select data-admin-list="auditors" data-index="${index}" data-field="role">${roleOptions.map((option) => `<option value="${option.value}" ${option.value === role ? 'selected' : ''}>${option.label}</option>`).join('')}</select></td>
                <td class="admin-center-cell"><label class="switch-lite"><input data-admin-list="auditors" data-index="${index}" data-field="active" type="checkbox" ${active ? 'checked' : ''}><span>Actif</span></label></td>
                <td><span class="admin-rights-summary">${escapeHtml(rightsLabel)}</span></td>
                <td>${locked ? '<span class="admin-lock-badge">Compte de base</span>' : `<button class="small-danger-button" type="button" data-admin-remove="auditors" data-index="${index}">×</button>`}</td>
            </tr>
        `;
        }).join('') || '<tr><td colspan="8"><p class="dynamic-empty">Aucun auditeur / utilisateur renseigné.</p></td></tr>';
    }

    function renderAdminMethods() {
        if (!els.adminMethodsBody) return;
        els.adminMethodsBody.innerHTML = (appState.admin.methods || []).map((row, index) => {
            const locked = isAdminRowLocked('methods', index, row);
            return `
            <tr class="${locked ? 'admin-row-locked' : ''}">
                <td><input data-admin-list="methods" data-index="${index}" data-field="method" value="${escapeHtml(row.method || '')}"></td>
                <td><input data-admin-list="methods" data-index="${index}" data-field="version" value="${escapeHtml(row.version || '')}"></td>
                <td>${locked ? '<span class="admin-lock-badge">Verrouillé</span>' : `<button class="small-danger-button" type="button" data-admin-remove="methods" data-index="${index}">×</button>`}</td>
            </tr>
        `;
        }).join('');
    }

    function renderSingleColumnAdmin(listName, body, placeholder) {
        if (!body) return;
        body.innerHTML = (appState.admin[listName] || []).map((value, index) => {
            const locked = isAdminRowLocked(listName, index);
            return `
            <tr class="${locked ? 'admin-row-locked' : ''}">
                <td><input data-admin-list="${listName}" data-index="${index}" data-field="value" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(placeholder)}"></td>
                <td>${locked ? '<span class="admin-lock-badge">Verrouillé</span>' : `<button class="small-danger-button" type="button" data-admin-remove="${listName}" data-index="${index}">×</button>`}</td>
            </tr>
        `;
        }).join('');
    }


    let draggedChecklistIndex = null;

    function handleChecklistDragStart(event) {
        const row = event.target.closest('[data-checklist-row]');
        if (!row) return;
        draggedChecklistIndex = Number(row.dataset.checklistRow);
        row.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(draggedChecklistIndex));
    }

    function handleChecklistDragOver(event) {
        const row = event.target.closest('[data-checklist-row]');
        if (!row || draggedChecklistIndex === null) return;
        const targetIndex = Number(row.dataset.checklistRow);
        const source = appState.admin.checklistItems[draggedChecklistIndex];
        const target = appState.admin.checklistItems[targetIndex];
        if (!source || !target || source.category !== target.category) return;
        event.preventDefault();
        row.classList.add('drag-over');
    }

    function handleChecklistDrop(event) {
        const row = event.target.closest('[data-checklist-row]');
        if (!row || draggedChecklistIndex === null) return;
        event.preventDefault();
        const targetIndex = Number(row.dataset.checklistRow);
        if (targetIndex === draggedChecklistIndex) return;
        const items = appState.admin.checklistItems || [];
        const source = items[draggedChecklistIndex];
        const target = items[targetIndex];
        if (!source || !target) return;
        if (source.category !== target.category) {
            showToast('Déplacement possible uniquement dans la même catégorie.');
            return;
        }
        const [moved] = items.splice(draggedChecklistIndex, 1);
        items.splice(targetIndex, 0, moved);
        appState.admin.checklistItems = renumberChecklistItems(items);
        persist();
        renderAdminChecklist();
        renderChecklist();
        showToast('Question déplacée.');
    }

    function handleChecklistDragEnd() {
        draggedChecklistIndex = null;
        if (!els.adminChecklistBody) return;
        els.adminChecklistBody.querySelectorAll('.dragging, .drag-over').forEach((row) => row.classList.remove('dragging', 'drag-over'));
    }

    let draggedCobenefitIndex = null;

    function handleCobenefitDragStart(event) {
        const row = event.target.closest('[data-cobenefit-row]');
        if (!row) return;
        draggedCobenefitIndex = Number(row.dataset.cobenefitRow);
        row.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(draggedCobenefitIndex));
    }

    function handleCobenefitDragOver(event) {
        const row = event.target.closest('[data-cobenefit-row]');
        if (!row || draggedCobenefitIndex === null) return;
        const targetIndex = Number(row.dataset.cobenefitRow);
        const source = appState.admin.cobenefitRules[draggedCobenefitIndex];
        const target = appState.admin.cobenefitRules[targetIndex];
        if (!source || !target || source.category !== target.category) return;
        event.preventDefault();
        row.classList.add('drag-over');
    }

    function handleCobenefitDrop(event) {
        const row = event.target.closest('[data-cobenefit-row]');
        if (!row || draggedCobenefitIndex === null) return;
        event.preventDefault();
        const targetIndex = Number(row.dataset.cobenefitRow);
        if (targetIndex === draggedCobenefitIndex) return;
        const items = appState.admin.cobenefitRules || [];
        const source = items[draggedCobenefitIndex];
        const target = items[targetIndex];
        if (!source || !target) return;
        if (source.category !== target.category) {
            showToast('Déplacement possible uniquement dans la même catégorie.');
            return;
        }
        const [moved] = items.splice(draggedCobenefitIndex, 1);
        items.splice(targetIndex, 0, moved);
        appState.admin.cobenefitRules = items;
        persist();
        renderAdminCobenefits();
        renderCobenefits();
        showToast('Co-bénéfice déplacé.');
    }

    function handleCobenefitDragEnd() {
        draggedCobenefitIndex = null;
        if (!els.adminCobenefitsBody) return;
        els.adminCobenefitsBody.querySelectorAll('.dragging, .drag-over').forEach((row) => row.classList.remove('dragging', 'drag-over'));
    }

    function updateAdminFromDom(event) {
        if (handleReportSchemaAdminInput(event)) return;
        const input = event.target.closest('[data-admin-list], [data-cobenefit-admin-points], [data-cobenefit-max-points]');
        if (!input) return;
        const list = input.dataset.adminList || '';
        const index = Number(input.dataset.index || 0);
        const field = input.dataset.field || '';
        if (!hasPermission('canAccessAdmin')) return;
        if (input.matches('[data-cobenefit-admin-points]')) {
            const item = appState.admin.cobenefitRules && appState.admin.cobenefitRules[Number(input.dataset.cobenefitIndex)];
            if (!item) return;
            item.points = item.points || {};
            const key = input.dataset.methodKey;
            if (String(input.value || '').trim() === '') delete item.points[key];
            else item.points[key] = input.value;
        } else if (input.matches('[data-cobenefit-max-points]')) {
            const item = appState.admin.cobenefitMaxPoints && appState.admin.cobenefitMaxPoints[Number(input.dataset.cobenefitMaxIndex)];
            if (!item) return;
            item.maxPoints = item.maxPoints || {};
            const key = input.dataset.methodKey;
            const value = String(input.value || '').trim();
            if (!value) delete item.maxPoints[key];
            else item.maxPoints[key] = normalizeMaxPointsValue(value);
        } else if (['auditorStatuses', 'civilities', 'auditTypes', 'species'].includes(list)) {
            appState.admin[list][index] = input.value;
        } else if (list === 'users') {
            const item = appState.admin.users[index];
            if (!item) return;
            if (field === 'email') item.email = normalizeEmail(input.value);
            else if (field === 'role') item.role = ROLE_LABELS[input.value] ? input.value : 'auditor';
            else if (field === 'active') item.active = input.checked;
            else item[field] = input.value;
            if (normalizeEmail(item.email) === currentUserEmail) applyAuthVisibility();
        } else if (list === 'auditors') {
            const item = appState.admin.auditors[index];
            if (!item) return;
            if (field === 'email') item.email = normalizeEmail(input.value);
            else if (field === 'role') item.role = ROLE_LABELS[input.value] ? input.value : 'auditor';
            else if (field === 'active') item.active = input.checked;
            else item[field] = input.value;
            appState.admin.users = syncUsersFromAuditors(appState.admin.auditors);
            if (normalizeEmail(item.email) === currentUserEmail || !getCurrentUser()) applyAuthVisibility();
        } else if (list === 'customLists') {
            const item = appState.admin.customLists[index];
            if (!item) return;
            if (field === 'name') item.name = input.value;
            if (field === 'values') item.values = String(input.value || '').split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
        } else if (list === 'methods') {
            appState.admin[list][index][field] = input.value;
        } else if (list === 'checklistItems') {
            const item = appState.admin.checklistItems[index];
            if (!item) return;
            if (field === 'title') item.title = input.value;
            if (field === 'detail') item.detail = input.value;
            if (field === 'category') item.category = input.value;
            if (field === 'type') item.type = input.value;
            if (field === 'category') normalizeChecklistOrdering();
        } else if (list === 'cobenefitRules') {
            const item = appState.admin.cobenefitRules[index];
            if (!item) return;
            if (field === 'category') item.category = input.value;
            if (field === 'title') item.title = input.value;
            if (field === 'criterion') item.criterion = input.value;
            if (field === 'category') normalizeCobenefitOrdering();
        } else if (list === 'cobenefitMaxPoints') {
            const item = appState.admin.cobenefitMaxPoints[index];
            if (!item) return;
            if (field === 'category') item.category = input.value;
        }
        persist();
        refreshReportAfterAdminListChange();
        if (list === 'methods' && event.type === 'change') {
            renderAdminChecklist();
            renderAdminCobenefits();
            renderAdminCobenefitMaxPoints();
        }
        if (list === 'checklistItems' && field === 'category') renderAdminChecklist();
        if (list === 'cobenefitRules' && field === 'category') renderAdminCobenefits();
        renderChecklist();
        renderCobenefits();
        refreshDerivedReportFields();
    }

    function handleAdminClick(event) {
        if (!hasPermission('canAccessAdmin')) return;
        if (handleReportSchemaAdminClick(event)) return;
        const applicability = event.target.closest('[data-checklist-applicability]');
        if (applicability) {
            const index = Number(applicability.dataset.checklistIndex);
            const key = applicability.dataset.methodKey;
            const item = appState.admin.checklistItems && appState.admin.checklistItems[index];
            if (item) {
                item.applicability = item.applicability || {};
                item.applicability[key] = applicability.checked;
                persist();
                renderChecklist();
            }
            return;
        }
        const matrixLink = event.target.closest('[data-checklist-cobenefit-link]');
        if (matrixLink) {
            const rowId = matrixLink.dataset.checklistId;
            const colId = matrixLink.dataset.cobenefitId;
            appState.admin.checklistCobenefitMatrix = appState.admin.checklistCobenefitMatrix || {};
            appState.admin.checklistCobenefitMatrix[rowId] = appState.admin.checklistCobenefitMatrix[rowId] || {};
            if (matrixLink.checked) appState.admin.checklistCobenefitMatrix[rowId][colId] = true;
            else delete appState.admin.checklistCobenefitMatrix[rowId][colId];
            appState.admin.checklistCobenefitMatrix = normalizeChecklistCobenefitMatrix(appState.admin.checklistCobenefitMatrix);
            persist();
            renderChecklist();
            showToast('Matrice d’alerte mise à jour.');
            return;
        }
        const tabMove = event.target.closest('[data-tab-order-move]');
        if (tabMove) {
            const index = Number(tabMove.dataset.index);
            const direction = tabMove.dataset.tabOrderMove;
            const order = normalizeTabOrder(appState.admin.tabOrder);
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target >= 0 && target < order.length) {
                const [moved] = order.splice(index, 1);
                order.splice(target, 0, moved);
                appState.admin.tabOrder = order;
                applyMainTabOrder();
                renderAdminTabOrder();
                persist();
            }
            return;
        }
        const add = event.target.closest('[data-admin-add]');
        const remove = event.target.closest('[data-admin-remove]');
        if (add) {
            const list = add.dataset.adminAdd;
            ensureAdminDataShape();
            if (list === 'users') appState.admin.users.push({ name: '', email: '', password: '', role: 'auditor', active: true });
            else if (list === 'auditors') appState.admin.auditors.push({ name: `Nouvel auditeur ${((appState.admin.auditors || []).length + 1)}`, email: '', password: '', role: 'auditor', active: true, qualifications: '' });
            else if (list === 'methods') appState.admin.methods.push({ method: '', version: '' });
            else if (list === 'checklistItems') appState.admin.checklistItems.push({ id: createId(), number: String((appState.admin.checklistItems || []).length + 1), category: 'Éligibilité', title: '', detail: '', type: 'Obligatoire', locked: false, applicability: {} });
            else if (list === 'cobenefitRules') {
                appState.admin.cobenefitRules.push({ id: createId(), category: 'Socio-économique', title: '', criterion: '', locked: false, points: {} });
                normalizeCobenefitOrdering();
            }
            else if (list === 'cobenefitMaxPoints') appState.admin.cobenefitMaxPoints.push({ category: 'Socio-économique', locked: false, maxPoints: {} });
            else if (list === 'customLists') appState.admin.customLists.push({ id: `custom_list_${createId()}`, name: 'Nouvelle liste', values: ['Option 1'] });
            else if (Array.isArray(appState.admin[list])) appState.admin[list].push('');
            renderAdmin();
            persist();
            refreshReportAfterAdminListChange();
            const selector = `[data-admin-list="${list}"]`;
            const fields = els.adminPanel.querySelectorAll(selector);
            const lastField = fields[fields.length - 1];
            if (lastField) lastField.focus();
        }
        if (remove) {
            const list = remove.dataset.adminRemove;
            const index = Number(remove.dataset.index);
            if (isAdminRowLocked(list, index, appState.admin[list] && appState.admin[list][index])) {
                showToast('La liste de base est verrouillée.');
                return;
            }
            appState.admin[list].splice(index, 1);
            appState.admin = normalizeAdminData(appState.admin);
            if (!getCurrentUser()) logoutCurrentUser();
            renderAdmin();
            refreshReportAfterAdminListChange();
            renderChecklist();
            renderCobenefits();
            persist();
        }
    }

    function exportAdminCsv() {
        const methodKeys = getMethodVersionKeys();
        const lines = [['table', 'valeur', 'valeur_2', 'categorie', 'type', 'applicabilite_methode_version', 'mot_de_passe'].join(';')];
        (appState.admin.auditors || []).forEach((row) => lines.push(['auditeurs', csvCell(row.name), csvCell(row.email || ''), csvCell(row.qualifications || ''), csvCell(row.role || 'auditor'), csvCell(row.active === false ? 'non' : 'oui'), csvCell(row.password || '')].join(';')));
        (appState.admin.auditorStatuses || []).forEach((value) => lines.push(['statuts_auditeurs', csvCell(value), '', '', '', ''].join(';')));
        (appState.admin.civilities || []).forEach((value) => lines.push(['civilites', csvCell(value), '', '', '', ''].join(';')));
        (appState.admin.auditTypes || []).forEach((value) => lines.push(['types_audit', csvCell(value), '', '', '', ''].join(';')));
        (appState.admin.methods || []).forEach((row) => lines.push(['methodes', csvCell(row.method), csvCell(row.version), '', '', ''].join(';')));
        (appState.admin.species || []).forEach((value) => lines.push(['essences', csvCell(value), '', '', '', ''].join(';')));
        (appState.admin.customLists || []).forEach((list) => {
            (list.values || []).forEach((value) => lines.push(['listes_personnalisees', csvCell(list.name || ''), csvCell(value || ''), '', '', ''].join(';')));
        });
        (appState.admin.checklistItems || []).forEach((item) => {
            const applicable = methodKeys.filter((entry) => item.applicability && item.applicability[entry.key]).map((entry) => `${entry.method} - ${entry.version}`).join('|');
            lines.push(['checklist', csvCell(`${item.number || ''} ${item.title || ''}`.trim()), csvCell(item.detail || ''), csvCell(item.category || ''), csvCell(item.type || ''), csvCell(applicable)].join(';'));
        });
        (appState.admin.cobenefitRules || []).forEach((item) => {
            const points = methodKeys
                .filter((entry) => item.points && item.points[entry.key] !== undefined && item.points[entry.key] !== '')
                .map((entry) => `${entry.method} - ${entry.version}=${item.points[entry.key]}`)
                .join('|');
            lines.push(['cobenefices', csvCell(item.title || ''), csvCell(item.criterion || ''), csvCell(item.category || ''), '', csvCell(points)].join(';'));
        });
        (appState.admin.cobenefitMaxPoints || []).forEach((item) => {
            const points = methodKeys
                .filter((entry) => item.maxPoints && item.maxPoints[entry.key] !== undefined && item.maxPoints[entry.key] !== '')
                .map((entry) => `${entry.method} - ${entry.version}=${item.maxPoints[entry.key]}`)
                .join('|');
            lines.push(['max_points_cobenefices', csvCell(item.category || ''), '', '', '', csvCell(points)].join(';'));
        });
        downloadCsv(lines, `referentiel_admin_${todayISO()}.csv`);
        showToast('Export du référentiel généré.');
    }

    function importAdminCsv(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const imported = parseAdminCsv(String(reader.result || ''));
                appState.admin = normalizeAdminData(imported);
                renderAdmin();
                refreshReportAfterAdminListChange();
                renderChecklist();
                renderCobenefits();
                renderAdminRegistry();
                persist();
                showToast('Référentiel importé.');
            } catch (error) {
                showToast('Import impossible : vérifie le format CSV.');
            }
            event.target.value = '';
        };
        reader.readAsText(file, 'utf-8');
    }

    function parseAdminCsv(text) {
        const admin = { users: [], auditors: [], auditorStatuses: [], civilities: [], auditTypes: [], methods: [], species: [], customLists: [], checklistItems: [], cobenefitRules: [], cobenefitMaxPoints: [] };
        const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(parseCsvLine);
        rows.forEach((cols, index) => {
            if (index === 0 && String(cols[0] || '').toLowerCase() === 'table') return;
            const table = String(cols[0] || '').trim().toLowerCase();
            const v1 = String(cols[1] || '').trim();
            const v2 = String(cols[2] || '').trim();
            if (!v1 && !v2) return;
            if (table === 'utilisateurs') admin.users.push({ name: v1, email: v2, role: String(cols[3] || '').trim() || 'auditor', password: String(cols[5] || '').trim(), active: true });
            if (table === 'auditeurs') {
                const legacyAuditorFormat = v2 && !v2.includes('@') && !String(cols[3] || '').trim();
                admin.auditors.push({
                    name: v1,
                    email: legacyAuditorFormat ? '' : v2,
                    qualifications: legacyAuditorFormat ? v2 : String(cols[3] || '').trim(),
                    role: String(cols[4] || '').trim() || 'auditor',
                    active: String(cols[5] || 'oui').trim().toLowerCase() !== 'non',
                    password: String(cols[6] || '').trim()
                });
            }
            if (table === 'statuts_auditeurs') admin.auditorStatuses.push(v1);
            if (table === 'civilites') admin.civilities.push(v1);
            if (table === 'types_audit') admin.auditTypes.push(v1);
            if (table === 'methodes') admin.methods.push({ method: v1, version: v2 });
            if (table === 'essences') admin.species.push(v1);
            if (table === 'listes_personnalisees') admin.customLists.push({ name: v1, values: [v2].filter(Boolean) });
            if (table === 'checklist') {
                const parsed = parseChecklistNumberTitle(v1);
                const applicability = {};
                String(cols[5] || '').split('|').map((x) => x.trim()).filter(Boolean).forEach((label) => {
                    const pair = admin.methods.find((m) => `${m.method} - ${m.version}` === label);
                    if (pair) applicability[methodVersionKey(pair.method, pair.version)] = true;
                });
                admin.checklistItems.push({
                    id: createId(),
                    number: parsed.number,
                    title: parsed.title,
                    detail: v2,
                    category: String(cols[3] || '').trim() || 'Éligibilité',
                    type: String(cols[4] || '').trim() || 'Obligatoire',
                    applicability
                });
            }
            if (table === 'cobenefices') {
                const points = {};
                String(cols[5] || '').split('|').map((x) => x.trim()).filter(Boolean).forEach((entry) => {
                    const [label, value] = entry.split('=');
                    const pair = admin.methods.find((m) => `${m.method} - ${m.version}` === String(label || '').trim());
                    if (pair && String(value || '').trim() !== '') points[methodVersionKey(pair.method, pair.version)] = String(value || '').trim();
                });
                admin.cobenefitRules.push({
                    id: createId(),
                    title: v1,
                    criterion: v2,
                    category: String(cols[3] || '').trim() || 'Socio-économique',
                    points
                });
            }
            if (table === 'max_points_cobenefices') {
                const maxPoints = {};
                String(cols[5] || '').split('|').map((x) => x.trim()).filter(Boolean).forEach((entry) => {
                    const [label, value] = entry.split('=');
                    const pair = admin.methods.find((m) => `${m.method} - ${m.version}` === String(label || '').trim());
                    if (pair && String(value || '').trim() !== '') maxPoints[methodVersionKey(pair.method, pair.version)] = normalizeMaxPointsValue(value);
                });
                admin.cobenefitMaxPoints.push({
                    category: v1 || 'Socio-économique',
                    maxPoints
                });
            }
        });
        return admin;
    }

    function parseCsvLine(line) {
        const result = [];
        let current = '';
        let quoted = false;
        for (let i = 0; i < line.length; i += 1) {
            const char = line[i];
            const next = line[i + 1];
            if (char === '"' && quoted && next === '"') {
                current += '"';
                i += 1;
            } else if (char === '"') {
                quoted = !quoted;
            } else if (char === ';' && !quoted) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }


    function normalizeRegistryProject(row) {
        const normalized = {
            reference: String(row.reference ?? row['Référence du projet'] ?? row.ref ?? '').trim(),
            method: String(row.method ?? row['Méthode'] ?? '').trim(),
            name: String(row.name ?? row['Nom du projet'] ?? '').trim(),
            potentialRE: String(row.potentialRE ?? row['RE potentielles (tCO2)'] ?? row['RE potentielles (tCO2eq)'] ?? '').trim(),
            verifiedRE: String(row.verifiedRE ?? row['RE vérifiées (tCO2)'] ?? row['RE vérifiées (tCO2eq)'] ?? '').trim(),
            region: String(row.region ?? row['Région administrative'] ?? '').trim(),
            requester: String(row.requester ?? row['Demandeur'] ?? '').trim(),
            notificationDate: normalizeRegistryDate(row.notificationDate ?? row['Date de notification'] ?? ''),
            labelDate: normalizeRegistryDate(row.labelDate ?? row['Date de labelisation'] ?? row['Date de labellisation'] ?? ''),
            fundingRate: String(row.fundingRate ?? row['Financé à'] ?? '').trim()
        };
        return normalized;
    }

    function normalizeRegistryDate(value) {
        const text = String(value ?? '').trim();
        if (!text) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
        const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        return text;
    }

    function registryDateToDisplay(value) {
        const text = String(value || '').trim();
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[3]}/${match[2]}/${match[1]}` : text;
    }

    function parseRegistryCsv(text) {
        const lines = String(text || '').split(/\r?\n/).filter((line) => line.trim() !== '');
        if (!lines.length) return [];
        const header = parseCsvLine(lines[0]).map((cell) => String(cell || '').trim().replace(/^\uFEFF/, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i += 1) {
            const cols = parseCsvLine(lines[i]);
            const raw = {};
            header.forEach((name, index) => {
                raw[name] = cols[index] ?? '';
            });
            const project = normalizeRegistryProject(raw);
            if (project.name || project.reference) rows.push(project);
        }
        return rows;
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('Impossible de lire le fichier.'));
            reader.readAsText(file, 'utf-8');
        });
    }

    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Impossible de lire le fichier.'));
            reader.readAsArrayBuffer(file);
        });
    }

    function utf8Decode(bytes) {
        return new TextDecoder('utf-8').decode(bytes);
    }

    function readUint16(bytes, offset) {
        return (bytes[offset] | (bytes[offset + 1] << 8)) >>> 0;
    }

    function readUint32(bytes, offset) {
        return ((bytes[offset]) | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
    }

    function findZipEndOfCentralDirectory(bytes) {
        const minOffset = Math.max(0, bytes.length - 0x10000 - 22);
        for (let i = bytes.length - 22; i >= minOffset; i -= 1) {
            if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return i;
        }
        throw new Error('Archive ZIP invalide.');
    }

    function parseZipEntries(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        const eocd = findZipEndOfCentralDirectory(bytes);
        const entryCount = readUint16(bytes, eocd + 10);
        const centralDirectoryOffset = readUint32(bytes, eocd + 16);
        const entries = new Map();
        let cursor = centralDirectoryOffset;
        for (let i = 0; i < entryCount; i += 1) {
            if (readUint32(bytes, cursor) !== 0x02014b50) throw new Error('Entrée ZIP invalide.');
            const compressionMethod = readUint16(bytes, cursor + 10);
            const compressedSize = readUint32(bytes, cursor + 20);
            const uncompressedSize = readUint32(bytes, cursor + 24);
            const fileNameLength = readUint16(bytes, cursor + 28);
            const extraLength = readUint16(bytes, cursor + 30);
            const commentLength = readUint16(bytes, cursor + 32);
            const localHeaderOffset = readUint32(bytes, cursor + 42);
            const fileName = utf8Decode(bytes.slice(cursor + 46, cursor + 46 + fileNameLength));
            entries.set(fileName, {
                compressionMethod,
                compressedSize,
                uncompressedSize,
                localHeaderOffset
            });
            cursor += 46 + fileNameLength + extraLength + commentLength;
        }
        return { bytes, entries };
    }

    async function unzipEntryAsBytes(zip, entryName) {
        const entry = zip.entries.get(entryName);
        if (!entry) return null;
        const bytes = zip.bytes;
        const localOffset = entry.localHeaderOffset;
        if (readUint32(bytes, localOffset) !== 0x04034b50) throw new Error('En-tête ZIP local invalide.');
        const fileNameLength = readUint16(bytes, localOffset + 26);
        const extraLength = readUint16(bytes, localOffset + 28);
        const dataStart = localOffset + 30 + fileNameLength + extraLength;
        const compressedBytes = bytes.slice(dataStart, dataStart + entry.compressedSize);
        if (entry.compressionMethod === 0) return compressedBytes;
        if (entry.compressionMethod === 8) {
            if (typeof DecompressionStream === 'undefined') throw new Error('Ce navigateur ne sait pas décompresser les fichiers XLSX.');
            const input = new Blob([compressedBytes]);
            try {
                const rawStream = input.stream().pipeThrough(new DecompressionStream('deflate-raw'));
                return new Uint8Array(await new Response(rawStream).arrayBuffer());
            } catch (error) {
                const deflateStream = input.stream().pipeThrough(new DecompressionStream('deflate'));
                return new Uint8Array(await new Response(deflateStream).arrayBuffer());
            }
        }
        throw new Error(`Compression ZIP non prise en charge : ${entry.compressionMethod}`);
    }

    async function unzipEntryAsText(zip, entryName) {
        const bytes = await unzipEntryAsBytes(zip, entryName);
        return bytes ? utf8Decode(bytes) : '';
    }

    function parseSharedStrings(xmlText) {
        if (!xmlText) return [];
        const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
        return Array.from(doc.getElementsByTagName('si')).map((node) => String(node.textContent || ''));
    }

    function parseXlsxCellValue(cell, sharedStrings) {
        const type = String(cell.getAttribute('t') || '').trim();
        const valueNode = cell.getElementsByTagName('v')[0];
        if (type === 'inlineStr') return String(cell.textContent || '').trim();
        const value = String(valueNode ? valueNode.textContent : cell.textContent || '').trim();
        if (type === 's') return sharedStrings[Number(value)] || '';
        if (type === 'b') return value === '1' ? 'TRUE' : 'FALSE';
        return value;
    }

    function xlsxColumnIndex(cellRef) {
        const letters = String(cellRef || '').replace(/\d+/g, '');
        let index = 0;
        for (let i = 0; i < letters.length; i += 1) {
            index = index * 26 + (letters.charCodeAt(i) - 64);
        }
        return Math.max(0, index - 1);
    }

    function parseXlsxRow(row, sharedStrings) {
        const values = [];
        const cells = Array.from(row.children || []).filter((el) => String(el.tagName || '').toLowerCase() === 'c');
        cells.forEach((cell, position) => {
            const ref = cell.getAttribute('r') || '';
            const index = ref ? xlsxColumnIndex(ref) : position;
            values[index] = parseXlsxCellValue(cell, sharedStrings);
        });
        return values;
    }

    async function parseRegistryXlsx(arrayBuffer) {
        const zip = parseZipEntries(arrayBuffer);
        let workbookXml = await unzipEntryAsText(zip, 'xl/workbook.xml');
        if (!workbookXml) workbookXml = await unzipEntryAsText(zip, 'workbook.xml');
        if (!workbookXml) throw new Error('Classeur XLSX invalide : workbook.xml introuvable.');
        const workbookDoc = new DOMParser().parseFromString(workbookXml, 'application/xml');
        const sheetNodes = Array.from(workbookDoc.getElementsByTagName('sheet'));
        if (!sheetNodes.length) return [];
        const firstSheet = sheetNodes[0];
        const relId = firstSheet.getAttribute('r:id') || firstSheet.getAttribute('id') || '';
        let sheetPath = '';
        const relsXml = await unzipEntryAsText(zip, 'xl/_rels/workbook.xml.rels') || await unzipEntryAsText(zip, '_rels/workbook.xml.rels');
        if (relsXml && relId) {
            const relsDoc = new DOMParser().parseFromString(relsXml, 'application/xml');
            const relations = Array.from(relsDoc.getElementsByTagName('Relationship'));
            const match = relations.find((relation) => String(relation.getAttribute('Id') || '') === relId);
            if (match) sheetPath = String(match.getAttribute('Target') || '').trim();
        }
        sheetPath = sheetPath.replace(/^\/+/, '');
        if (sheetPath && !sheetPath.startsWith('xl/')) sheetPath = `xl/${sheetPath}`;
        if (!sheetPath) sheetPath = 'xl/worksheets/sheet1.xml';
        const sheetXml = await unzipEntryAsText(zip, sheetPath);
        if (!sheetXml) throw new Error('Classeur XLSX invalide : feuille de calcul introuvable.');
        const sharedStrings = parseSharedStrings(await unzipEntryAsText(zip, 'xl/sharedStrings.xml'));
        const sheetDoc = new DOMParser().parseFromString(sheetXml, 'application/xml');
        const rows = Array.from(sheetDoc.getElementsByTagName('row'));
        if (!rows.length) return [];
        const headers = parseXlsxRow(rows[0], sharedStrings).map((cell) => String(cell || '').trim().replace(/^\uFEFF/, ''));
        const projects = [];
        for (let i = 1; i < rows.length; i += 1) {
            const cols = parseXlsxRow(rows[i], sharedStrings);
            const raw = {};
            headers.forEach((name, index) => {
                raw[name] = cols[index] ?? '';
            });
            const project = normalizeRegistryProject(raw);
            if (project.name || project.reference) projects.push(project);
        }
        return projects;
    }

    async function importRegistryCsv(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const filename = String(file.name || '').toLowerCase();
        try {
            let projects = [];
            if (filename.endsWith('.xlsx')) {
                projects = await parseRegistryXlsx(await readFileAsArrayBuffer(file));
            } else {
                const text = await readFileAsText(file);
                projects = parseRegistryCsv(text);
            }
            appState.admin.lbcProjects = projects;
            appState.admin.lbcRegistryLastImport = new Date().toLocaleString('fr-FR');
            appState.admin = normalizeAdminData(appState.admin);
            renderAdminRegistry();
            persist();
            showToast(`${projects.length.toLocaleString('fr-FR')} projet(s) importé(s).`);
        } catch (error) {
            console.warn(error);
            showToast('Import registre impossible : vérifie le fichier XLSX ou CSV.');
        }
        event.target.value = '';
    }

    function populateRegistryDatalist() {
        if (!els.lbcProjectsDatalist) {
            const list = document.createElement('datalist');
            list.id = 'lbcProjectsDatalist';
            document.body.appendChild(list);
            els.lbcProjectsDatalist = list;
        }
        const projects = (appState.admin && appState.admin.lbcProjects) || [];
        els.lbcProjectsDatalist.innerHTML = projects
            .slice()
            .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fr'))
            .map((project) => `<option value="${escapeHtml(project.name || project.reference)}">${escapeHtml(project.reference ? `${project.reference} · ${project.method || ''} · ${project.region || ''}` : project.method || '')}</option>`)
            .join('');
        if (els.lbcProjectHint) {
            els.lbcProjectHint.textContent = projects.length
                ? `${projects.length.toLocaleString('fr-FR')} projet(s) disponibles depuis le registre local.`
                : 'Importe le registre dans l’espace Admin pour alimenter cette liste.';
        }
    }

    function findRegistryProjectByName(name) {
        const wanted = String(name || '').trim();
        if (!wanted) return null;
        return ((appState.admin && appState.admin.lbcProjects) || []).find((project) => String(project.name || '').trim() === wanted) || null;
    }

    function applySelectedLbcProject() {
        const project = currentProject();
        if (!project || !els.lbcProjectName) return;
        const registryProject = findRegistryProjectByName(els.lbcProjectName.value);
        if (!registryProject) return;
        const reportData = normalizeReport(project.data.report || {});
        reportData.project_name = registryProject.name;
        reportData.project_lbcNumber = registryProject.reference;
        reportData.client_name = registryProject.requester;
        reportData.project_method = registryProject.method || reportData.project_method;
        reportData.project_notificationDate = registryProject.notificationDate;
        reportData.project_labelDate = registryProject.labelDate;
        reportData.project_potentialEmissionReduction = registryProject.potentialRE;
        syncDerivedReportFields(reportData, project.data);
        project.data.report = reportData;
        syncReportFormFromState();
        renderChecklist();
        renderCobenefits();
        persist();
        showToast('Projet du registre appliqué.');
    }

    function renderAdminRegistry() {
        const projects = (appState.admin && appState.admin.lbcProjects) || [];
        if (els.registryProjectCount) els.registryProjectCount.textContent = projects.length.toLocaleString('fr-FR');
        if (els.registryLastImport) els.registryLastImport.textContent = appState.admin.lbcRegistryLastImport || '—';
        populateRegistryDatalist();
    }

    function importRegistryCsv(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const filename = String(file.name || '').toLowerCase();
        const finishImport = (projects) => {
            appState.admin.lbcProjects = projects;
            appState.admin.lbcRegistryLastImport = new Date().toLocaleString('fr-FR');
            appState.admin = normalizeAdminData(appState.admin);
            renderAdminRegistry();
            persist();
            showToast(`${projects.length.toLocaleString('fr-FR')} projet(s) importé(s).`);
            event.target.value = '';
        };
        const failImport = (error) => {
            console.warn(error);
            showToast('Import registre impossible : vérifie le fichier XLSX ou CSV.');
            event.target.value = '';
        };
        try {
            if (filename.endsWith('.xlsx')) {
                const reader = new FileReader();
                reader.onload = async () => {
                    try {
                        const projects = await parseRegistryXlsx(reader.result);
                        finishImport(projects);
                    } catch (error) {
                        failImport(error);
                    }
                };
                reader.onerror = () => failImport(reader.error || new Error('Impossible de lire le fichier.'));
                reader.readAsArrayBuffer(file);
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const projects = parseRegistryCsv(String(reader.result || ''));
                    finishImport(projects);
                } catch (error) {
                    failImport(error);
                }
            };
            reader.onerror = () => failImport(reader.error || new Error('Impossible de lire le fichier.'));
            reader.readAsText(file, 'utf-8');
        } catch (error) {
            failImport(error);
        }
    }

function exportRegistryCsv() {
        const header = ['Référence du projet', 'Méthode', 'Nom du projet', 'RE potentielles (tCO2)', 'RE vérifiées (tCO2)', 'Région administrative', 'Demandeur', 'Date de notification', 'Date de labelisation', 'Financé à'];
        const lines = [header.map(csvCell).join(';')];
        ((appState.admin && appState.admin.lbcProjects) || []).forEach((project) => {
            lines.push([
                project.reference,
                project.method,
                project.name,
                project.potentialRE,
                project.verifiedRE,
                project.region,
                project.requester,
                registryDateToDisplay(project.notificationDate),
                registryDateToDisplay(project.labelDate),
                project.fundingRate
            ].map(csvCell).join(';'));
        });
        downloadCsv(lines, `registre_lbc_${todayISO()}.csv`);
        showToast('Base projets exportée.');
    }

    function clearRegistryProjects() {
        if (!confirm('Vider la base locale des projets du registre ?')) return;
        appState.admin.lbcProjects = [];
        appState.admin.lbcRegistryLastImport = '';
        renderAdminRegistry();
        persist();
        showToast('Base projets vidée.');
    }

    function loadBundledRegistryIfNeeded() {
        if ((appState.admin.lbcProjects || []).length) return;
        fetch('assets/projets_lbc.csv')
            .then((response) => response.ok ? response.text() : '')
            .then((text) => {
                if (!text) return;
                const projects = parseRegistryCsv(text);
                if (!projects.length || (appState.admin.lbcProjects || []).length) return;
                appState.admin.lbcProjects = projects;
                appState.admin.lbcRegistryLastImport = 'Base intégrée';
                appState.admin = normalizeAdminData(appState.admin);
                renderAdminRegistry();
                persist();
            })
            .catch(() => {});
    }

    function resetAdminLists() {
        if (!confirm('Restaurer les listes admin par défaut ? Les listes actuelles seront remplacées.')) return;
        appState.admin = defaultAdminData();
        renderAdmin();
        refreshReportAfterAdminListChange();
        renderChecklist();
        renderCobenefits();
        renderAdminRegistry();
        persist();
        loadBundledRegistryIfNeeded();
        showToast('Listes admin restaurées.');
    }

    function registerServiceWorker() {
        if (window.auditLbcDesktop && window.auditLbcDesktop.isDesktop) return;
        if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
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

    function toInputNumberString(value, digits = 2) {
        const text = String(value ?? '').trim();
        if (!text) return '';
        const n = Number(text.replace(',', '.'));
        if (!Number.isFinite(n)) return '';
        const precision = Math.max(0, Number(digits) || 0);
        return n.toFixed(precision);
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

    // ══════════════════════════════════════════════════════════════════
    // PHASE 1 - CONTRÔLES DE COHÉRENCE
    // ══════════════════════════════════════════════════════════════════

    function reportFieldEl(name) {
        return document.querySelector(`[data-report-field="${name}"]`);
    }

    function markCobenefitValidity(input) {
        if (isValidCobenefitValue(input.value)) {
            input.classList.remove('validation-error');
            input.title = '';
        } else {
            input.classList.add('validation-error');
            input.title = 'Format attendu : nombre (ex : 12,34) ou NA';
        }
    }

    function isValidCobenefitValue(value) {
        const trimmed = String(value || '').trim();
        if (!trimmed) return true;
        if (['NA', 'N/A'].includes(trimmed.replace(/\s+/g, '').toUpperCase())) return true;
        const normalized = normalizeDecimalInput(trimmed);
        return /^[-+]?\d+(?:[.,]\d+)?$/.test(normalized);
    }

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2 - PANNEAU LATÉRAL ADMIN + EXPORT/IMPORT CSV
    // ══════════════════════════════════════════════════════════════════

    function setupAdminPanel() {
        const openBtn = $('openAdminPanel');
        const closeBtn = $('closeAdminPanel');
        const sidepanel = $('adminSidepanel');
        const content = sidepanel.querySelector('.admin-sidepanel-content');

        // On déplace #adminPanel entier (pas un clone, et pas ses sections une par
        // une) : les interactions admin sont déléguées sur ce conteneur, donc sortir
        // les sections de leur parent couperait ajout, suppression et édition.
        const adminTab = $('adminPanel');
        if (adminTab && content) {
            adminTab.classList.remove('tab-panel');
            adminTab.removeAttribute('hidden');
            content.appendChild(adminTab);
        }

        // Cacher l'onglet Admin du projet
        const adminTabButton = document.querySelector('[data-tab="admin"]');
        if (adminTabButton) {
            adminTabButton.style.display = 'none';
        }

        if (openBtn) {
            openBtn.addEventListener('click', () => {
                if (!hasPermission('canAccessAdmin')) { showToast('Ton profil ne permet pas d’ouvrir les paramètres.'); return; }
                sidepanel.classList.add('open');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                sidepanel.classList.remove('open');
            });
        }

        // Fermer en cliquant en dehors du panneau
        document.addEventListener('click', (event) => {
            if (!sidepanel.classList.contains('open')) return;
            // Un clic sur une ligne supprimée par un re-render détache la cible du
            // document : ce n'est pas un clic « en dehors ».
            if (!document.contains(event.target)) return;
            if (sidepanel.contains(event.target) || event.target === openBtn) return;
            sidepanel.classList.remove('open');
        });

        setupCsvExportImport();
    }

    function setupCsvExportImport() {
        // Boutons Export
        document.querySelectorAll('[data-admin-export]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const listName = btn.dataset.adminExport;
                exportListToCsv(listName);
            });
        });

        // Boutons Import
        document.querySelectorAll('[data-admin-import]').forEach((input) => {
            const label = input.closest('label');
            if (label) {
                label.addEventListener('click', () => {
                    input.click();
                });
            }
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const listName = e.target.dataset.adminImport;
                    const file = e.target.files[0];
                    importCsvToList(listName, file);
                    e.target.value = '';
                }
            });
        });
    }

    function exportListToCsv(listName) {
        let data = appState.admin?.[listName] || [];
        let headers = [];
        let rows = [];

        switch (listName) {
            case 'auditors':
                headers = ['Nom', 'Email', 'Mot de passe', 'Qualifications', 'Rôle', 'Actif'];
                rows = data.map((item) => [item.name || '', item.email || '', item.password || '', item.qualifications || '', ROLE_LABELS[item.role] || item.role || 'Auditeur', item.active === false ? 'Non' : 'Oui']);
                break;
            case 'auditorStatuses':
                headers = ['Statut'];
                rows = data.map((item) => [item]);
                break;
            case 'civilities':
                headers = ['Civilité'];
                rows = data.map((item) => [item]);
                break;
            case 'auditTypes':
                headers = ['Type d\'audit'];
                rows = data.map((item) => [item]);
                break;
            case 'species':
                headers = ['Essence'];
                rows = data.map((item) => [item]);
                break;
            case 'methods':
                headers = ['Méthode', 'Version'];
                rows = data.map((item) => [item.method || '', item.version || '']);
                break;
            case 'customLists':
                headers = ['Liste', 'Valeur'];
                rows = data.flatMap((item) => (item.values || []).map((value) => [item.name || '', value || '']));
                break;
            case 'checklistItems': {
                const methodKeys = getMethodVersionKeys();
                headers = ['Question', 'Détail', 'Catégorie', 'Type', 'Applicabilité'];
                rows = data.map((item) => [
                    `${item.number || ''} ${item.title || ''}`.trim(),
                    item.detail || '',
                    item.category || '',
                    item.type || '',
                    methodKeys.filter((entry) => item.applicability && item.applicability[entry.key])
                        .map((entry) => entry.label).join('|')
                ]);
                break;
            }
            case 'cobenefitRules': {
                const methodKeys = getMethodVersionKeys();
                headers = ['Réponse', 'Critère', 'Catégorie', 'Points'];
                rows = data.map((item) => [
                    item.title || '',
                    item.criterion || '',
                    item.category || '',
                    methodKeys.filter((entry) => item.points && item.points[entry.key] !== undefined && item.points[entry.key] !== '')
                        .map((entry) => `${entry.label}=${item.points[entry.key]}`).join('|')
                ]);
                break;
            }
            case 'cobenefitMaxPoints': {
                const methodKeys = getMethodVersionKeys();
                headers = ['Catégorie', 'Maximum'];
                rows = data.map((item) => [
                    item.category || '',
                    methodKeys.filter((entry) => item.maxPoints && item.maxPoints[entry.key] !== undefined && item.maxPoints[entry.key] !== '')
                        .map((entry) => `${entry.label}=${item.maxPoints[entry.key]}`).join('|')
                ]);
                break;
            }
            default:
                showToast('Export non disponible pour cette liste.');
                return;
        }

        const csvContent = [
            headers.join(';'),
            ...rows.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `${listName}_export.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Export ${listName} complété.`);
    }

    function importCsvToList(listName, file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const lines = String(e.target.result || '').split(/\r?\n/).filter((line) => line.trim());
                if (lines.length < 2) {
                    showToast('Erreur : fichier CSV vide ou sans données.');
                    return;
                }

                const headers = parseCsvLine(lines[0]).map((h) => h.trim());
                const dataRows = lines.slice(1);
                const warnings = [];
                const validRows = [];

                dataRows.forEach((line, index) => {
                    const cells = parseCsvLine(line).map((cell) => cell.trim());

                    if (cells.length !== headers.length) {
                        warnings.push(`Ligne ${index + 2} : ${cells.length} colonnes au lieu de ${headers.length}`);
                    } else {
                        validRows.push(cells);
                    }
                });

                if (validRows.length === 0) {
                    showToast('Erreur : aucune ligne valide trouvée.');
                    return;
                }

                confirmImport(listName, headers, validRows, warnings);
            } catch (err) {
                showToast(`Erreur de lecture CSV : ${err.message}`);
            }
        };
        reader.readAsText(file);
    }

    function confirmImport(listName, headers, rows, warnings) {
        const message = `Importer ${rows.length} ligne(s) pour ${listName} ?${warnings.length ? `\n\n⚠️ ${warnings.length} ligne(s) problématique(s) seront ignorées.` : ''}`;
        if (!confirm(message)) return;

        try {
            const methodKeys = getMethodVersionKeys();
            const findKey = (label) => methodKeys.find((entry) => entry.label === String(label || '').trim())?.key;
            const data = [];
            rows.forEach((row) => {
                switch (listName) {
                    case 'auditors': {
                        const normalizedHeaders = headers.map((header) => normalizeComparisonKey(header));
                        const hasEmailColumn = normalizedHeaders.some((header) => header.includes('email'));
                        if (!hasEmailColumn) {
                            data.push({ name: row[0] || '', qualifications: row[1] || '', role: 'auditor', active: true });
                        } else {
                            data.push({
                                name: row[0] || '',
                                email: normalizeEmail(row[1] || ''),
                                password: row[2] || '',
                                qualifications: row[3] || '',
                                role: Object.keys(ROLE_LABELS).find((key) => ROLE_LABELS[key] === row[4]) || row[4] || 'auditor',
                                active: String(row[5] || 'oui').trim().toLowerCase() !== 'non'
                            });
                        }
                        break;
                    }
                    case 'auditorStatuses':
                    case 'civilities':
                    case 'auditTypes':
                    case 'species':
                        data.push(row[0] || '');
                        break;
                    case 'methods':
                        data.push({ method: row[0] || '', version: row[1] || '' });
                        break;
                    case 'customLists':
                        data.push({ name: row[0] || 'Liste importée', values: [row[1] || ''].filter(Boolean) });
                        break;
                    case 'checklistItems': {
                        const parsed = parseChecklistNumberTitle(row[0] || '');
                        const applicability = {};
                        String(row[4] || '').split('|').map((x) => x.trim()).filter(Boolean).forEach((label) => {
                            const key = findKey(label);
                            if (key) applicability[key] = true;
                        });
                        data.push({
                            id: createId(),
                            number: parsed.number,
                            title: parsed.title,
                            detail: row[1] || '',
                            category: row[2] || 'Éligibilité',
                            type: row[3] || 'Obligatoire',
                            applicability
                        });
                        break;
                    }
                    case 'cobenefitRules': {
                        const points = {};
                        String(row[3] || '').split('|').map((x) => x.trim()).filter(Boolean).forEach((entry) => {
                            const [label, value] = entry.split('=');
                            const key = findKey(label);
                            if (key && String(value || '').trim() !== '') points[key] = String(value || '').trim();
                        });
                        data.push({
                            id: createId(),
                            title: row[0] || '',
                            criterion: row[1] || '',
                            category: row[2] || 'Socio-économique',
                            points
                        });
                        break;
                    }
                    case 'cobenefitMaxPoints': {
                        const maxPoints = {};
                        String(row[1] || '').split('|').map((x) => x.trim()).filter(Boolean).forEach((entry) => {
                            const [label, value] = entry.split('=');
                            const key = findKey(label);
                            if (key && String(value || '').trim() !== '') maxPoints[key] = normalizeMaxPointsValue(value);
                        });
                        data.push({
                            category: row[0] || 'Socio-économique',
                            maxPoints
                        });
                        break;
                    }
                    default:
                        break;
                }
            });

            if (!data.length) {
                showToast('Import annulé : aucune donnée exploitable pour cette liste.');
                return;
            }

            appState.admin[listName] = data;
            appState.admin = normalizeAdminData(appState.admin);
            persist();
            renderAdmin();
            refreshReportAfterAdminListChange();
            renderChecklist();
            renderCobenefits();
            showToast(`✅ ${data.length} élément(s) importé(s) pour ${listName}.`);

            if (warnings.length > 0) {
                showToast(`⚠️ ${warnings.length} ligne(s) ignorée(s).`);
            }
        } catch (err) {
            showToast(`Erreur d'import : ${err.message}`);
        }
    }
})();
