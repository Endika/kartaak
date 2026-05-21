// NOTE: Euskara translations generated without a native review. Please verify.
export const eu: Record<string, string> = {
  // App-wide
  'app.cancel': 'Utzi',
  'app.save': 'Gorde',
  'app.saving': 'Gordetzen…',
  'app.somethingWentWrong': 'Zerbait gaizki joan da',

  // AA / sare erroreak
  'error.ai.missingKey': 'Ez dago {provider}-(e)ko API gakorik. Gehitu bat Ezarpenetan.',
  'error.ai.invalidKey': '{provider}-k API gakoa baztertu du. Berrikusi Ezarpenetan.',
  'error.ai.rateLimit':
    '{provider}-k eskaerak mugatzen ditu. Itxaron pixka bat eta saiatu berriro.',
  'error.ai.providerUnavailable':
    '{provider} ez dago erabilgarri (HTTP {status}). Saiatu berriro pixka bat itxaron ondoren.',
  'error.ai.network':
    'Ezin izan da {provider}-(r)ekin konektatu. Egiaztatu zure konexioa eta saiatu berriro.',
  'error.ai.invalidResponse': '{provider}-k espero ez zen erantzun bat itzuli du. Saiatu berriro.',
  'error.ai.empty': '{provider}-k erantzun hutsa itzuli du. Saiatu berriro.',
  'error.ai.noCards':
    'Ereduak ez du erabilgarriko txartelik itzuli. Saiatu gaia edo eredua aldatzen.',
  'error.ai.allDuplicates':
    'Sortutako txartel guztiak lehendik daudenen bikoiztuak dira. Aldatu gaia edo argibideak.',

  // Flip card
  'flipCard.aria': 'Txartela, sakatu erantzuna ikusteko',
  'flipCard.tapToFlip': 'sakatu biratzeko',
  'flipCard.tapToFlipBack': 'sakatu atzera biratzeko',

  // AI model options
  'model.gemini.label': 'Gemini',
  'model.gemini.hint': 'gemini-2.5-flash · merkeena, nabigatzailetik zuzenean dabil',
  'model.anthropic.label': 'Claude',
  'model.anthropic.hint': 'claude-haiku-4-5 · nabigatzailetik goiburuaren bidez',
  'model.openai.label': 'OpenAI',
  'model.openai.hint': 'gpt-4o-mini · CORS blokeatuta, proxy bat behar du',

  // Issue types
  'issueType.incorrect': 'Erantzuna okerra da',
  'issueType.confusing': 'Galdera nahasgarria da',
  'issueType.typo': 'Akats ortografiko edo formatu-arazoa dago',
  'issueType.difficulty': 'Zailtasuna ez da egokia (errazegia / zailegia)',
  'issueType.other': 'Beste zerbait (deskribatu behean)',
  'issueType.label.incorrect': 'okerra',
  'issueType.label.confusing': 'nahasgarria',
  'issueType.label.typo': 'akatsa',
  'issueType.label.difficulty': 'zailtasuna',
  'issueType.label.other': 'bestelakoa',

  // HomePage
  'home.title': 'Nire ikasketak',
  'home.settings': 'Ezarpenak',
  'home.import': 'Inportatu',
  'home.newStudy': '+ Ikasketa berria',
  'home.apiNotice':
    'Ez dago AA hornitzailerik konfiguratuta. Sorkuntzak huts egingo du gako bat gehitu arte.',
  'home.openSettings': 'Ireki ezarpenak',
  'home.noStudies': 'Oraindik ez dago ikasketarik.',
  'home.createFirst': 'Sortu zure lehen ikasketa',
  'home.searchPlaceholder': 'Bilatu ikasketak…',
  'home.sort.recent': 'Berrienak',
  'home.sort.progress': 'Aurrerapena',
  'home.sort.name': 'Izena',
  'home.noMatches': 'Ez dator bat ikasketarik "{query}"-(r)ekin.',
  'home.studyCardCount': '{count} txartel',
  'home.studyProgress': '{learned}/{total} ikasita · %{pct}',
  'home.importFailed': 'Inportazioak huts egin du',
  'home.studyNotFound': 'Ikasketa ez da aurkitu.',
  'home.back': 'Hasiera',

  // SettingsPage
  'settings.title': 'Ezarpenak',
  'settings.back': 'Atzera',
  'settings.language.heading': 'Hizkuntza',
  'settings.language.hint': 'Interfaze osoan erabiltzen da.',
  'settings.provider.heading': '{provider}-(e)ko API gakoa',
  'settings.provider.storedHelp': 'Zure nabigatzailean bakarrik gordetzen da. Hemen lor dezakezu:',
  'settings.provider.currentlySet': 'Konfiguratuta:',
  'settings.provider.save': 'Gorde',
  'settings.provider.clear': 'Garbitu',
  'settings.provider.gemini.label': 'Gemini',
  'settings.provider.anthropic.label': 'Anthropic (Claude)',
  'settings.provider.openai.label': 'OpenAI',
  'settings.provider.anthropic.note':
    'Deiek dangerous-direct-browser-access goiburua erabiltzen dute. Proxyrik gabe dabil, baina zure gakoa anthropic.com-era zuzenean bidaltzen du.',
  'settings.provider.openai.note':
    'OpenAI-k ez ditu nabigatzailetik egindako deiak onartzen kasu gehienetan — CORS erroreak espero proxyrik ez baduzu.',

  // WorkflowPage
  'workflow.title': 'Ikasketa berria',
  'workflow.subtitle':
    'Deskribatu zer ikasi nahi duzun. AAk aurrebista bat sortuko du sorta osoa egin aurretik.',
  'workflow.back': 'Atzera',
  'workflow.fields.theme': 'Gaia',
  'workflow.fields.themeHint':
    'Zer ikasten ari zara? Adib. "Biderketaren taulak", "Bidaiatzeko ingelesa", "JavaScript closures".',
  'workflow.fields.topics': 'Azpigaiak (aukerakoa)',
  'workflow.fields.topicsHint': 'Komaz banatuta. Adib. "7, 8" edo "Bidaia, Jatetxea, Hotela".',
  'workflow.fields.instructions': 'Sortzeko argibideak (aukerakoa)',
  'workflow.fields.instructionsHint':
    'Esan AAri nola nahi dituzun txartelak. Formatua, zailtasuna, estiloa. Hutsik utzi balio lehenetsiak erabiltzeko.',
  'workflow.fields.aiModel': 'AA eredua',
  'workflow.fields.aiModelHint':
    'Aukeratu hornitzaile bat. Ziurtatu Ezarpenetan haren API gakoa duzula.',
  'workflow.fields.quantity': 'Zenbat txartel?',
  'workflow.fields.quantityHint':
    '4 txartelen aurrebista sortzen da lehenik — sorta osoa onartu ondoren bakarrik ordainduko duzu.',
  'workflow.submit': 'Sortu aurrebista →',
  'workflow.submitBusy': 'Aurrebista sortzen…',
  'workflow.cancel': 'Utzi',
  'workflow.invalidInput': 'Datu baliogabeak',
  'workflow.missingApiKey': 'Konfiguratu lehenik {model}-(e)ko API gakoa Ezarpenetan.',
  'workflow.previewFailed': 'Aurrebistak huts egin du',

  // PreviewPage
  'preview.title': 'Aurrebista',
  'preview.subtitle': '{count} txartel-lagin ereduarengandik.',
  'preview.summary': '{theme} · {quantity} txartel · eredua: {model}',
  'preview.summaryWithTopics': '{theme} · {topics} · {quantity} txartel · eredua: {model}',
  'preview.back': 'Hasiera',
  'preview.editWorkflow': '← Editatu fluxua',
  'preview.regenerate': 'Birsortu aurrebista',
  'preview.regenerating': 'Birsortzen…',
  'preview.generateAll': 'Sortu {count} guztiak →',
  'preview.generating': '{count} sortzen…',
  'preview.regenerationFailed': 'Birsorkuntzak huts egin du',
  'preview.generationFailed': 'Sorkuntzak huts egin du',
  'preview.cardFront': 'Aurrealdea',
  'preview.cardBack': 'Atzealdea',

  // StudyPage (study session)
  'study.back': 'Hasiera',
  'study.progress': '{current} / {total} · {learned} ikasita',
  'study.incorrect': 'Okerra',
  'study.partial': 'Erdizka',
  'study.correct': 'Zuzena',
  'study.editCard': '✏️ Editatu',
  'study.reportIssue': '⚠️ Salatu arazoa',
  'study.flipHint': 'Sakatu edo tarte-tekla biratzeko — gero baloratu zure erantzuna.',
  'study.rateHint': 'Baloratu zenbateraino zenekien.',
  'study.complete.title': 'Saioa amaituta',
  'study.complete.summary': '{total} txartel guztiak ikusi dituzu · {learned} ikasita.',
  'study.complete.restart': 'Berrikusi berriro',
  'study.complete.backHome': 'Itzuli ikasketetara',
  'study.reviewFailed': 'Ezin izan da erantzuna gorde.',

  // StudyDetailPage
  'studyDetail.notFound': 'Ikasketa ez da aurkitu.',
  'studyDetail.back': 'Ikasketak',
  'studyDetail.backHome': 'Hasiera',
  'studyDetail.modelLabel': 'eredua: {model}',
  'studyDetail.rename': '✏️ Berrizendatu',
  'studyDetail.renameAria': 'Berrizendatu ikasketa',
  'studyDetail.subtitleNoTopics': '{theme} · eredua: {model}',
  'studyDetail.subtitleWithTopics': '{theme} · {topics} · eredua: {model}',
  'studyDetail.actions.study': '▶ Ikasi',
  'studyDetail.actions.addMore': '+ Gehiago gehitu',
  'studyDetail.actions.export': '📤 Esportatu',
  'studyDetail.actions.delete': '🗑 Ezabatu',
  'studyDetail.stats.total': 'Guztira',
  'studyDetail.stats.new': 'Berriak',
  'studyDetail.stats.learning': 'Ikasten',
  'studyDetail.stats.learned': 'Ikasita',
  'studyDetail.stats.learnedValue': '{learned} (%{pct})',
  'studyDetail.cards.heading': 'Txartelak',
  'studyDetail.cards.count': '({count})',
  'studyDetail.cards.editAria': 'Editatu txartela',
  'studyDetail.cards.edited': 'editatuta',
  'studyDetail.cards.status.new': 'berria',
  'studyDetail.cards.status.learning': 'ikasten',
  'studyDetail.cards.status.learned': 'ikasita',
  'studyDetail.issues.heading': 'Konpondu gabeko arazoak',
  'studyDetail.issues.count': '({count})',
  'studyDetail.issues.resolveAI': '🤖 Konpondu AArekin',
  'studyDetail.issues.markResolved': 'Konponduta markatu',
  'studyDetail.issues.dismiss': 'Baztertu',
  'studyDetail.rename.modalTitle': 'Berrizendatu ikasketa',
  'studyDetail.rename.save': 'Gorde',
  'studyDetail.delete.title': '¿Ikasketa hau ezabatu?',
  'studyDetail.delete.confirm': 'Ezabatu',
  'studyDetail.delete.cancel': 'Utzi',
  'studyDetail.delete.warning':
    '<strong>{name}</strong> ezabatzera zoaz, {count} txartel eta aurrerapen guztiak barne. Ezin da desegin.',
  'studyDetail.delete.busy': 'Ezabatzen…',

  // AddMoreCardsPage (form view)
  'addMore.notFound': 'Ikasketa ez da aurkitu.',
  'addMore.backHome': 'Hasiera',
  'addMore.backStudy': 'Ikasketa',
  'addMore.form.title': 'Gehitu txartel gehiago',
  'addMore.form.addingTo': '<strong>{name}</strong>-(e)ra gehitzen',
  'addMore.form.existingCount':
    '{count} txartel daude jada ikasketa honetan. Editatu fluxua sorta berriari ukitu bat eman nahi badiozu (adib. maila igo edo Claudera aldatu).',
  'addMore.form.theme': 'Gaia',
  'addMore.form.themeHint': 'Blokeatuta dago txartel berriak gai berekoak izaten jarrai daitezen.',
  'addMore.form.subtopics': 'Azpigaiak',
  'addMore.form.instructions': 'Sortzeko argibideak',
  'addMore.form.aiModel': 'AA eredua',
  'addMore.form.quantity': 'Zenbat gehitu?',
  'addMore.form.cancel': 'Utzi',
  'addMore.form.submit': 'Sortu aurrebista →',
  'addMore.form.submitBusy': 'Aurrebista sortzen…',
  'addMore.form.invalidValues': 'Inprimakian balio baliogabeak',
  'addMore.form.missingApiKey': 'Konfiguratu lehenik {model}-(e)ko API gakoa Ezarpenetan.',
  'addMore.form.previewFailed': 'Aurrebistak huts egin du',

  // AddMoreCardsPage (preview view)
  'addMore.preview.title': 'Txartel berrien aurrebista',
  'addMore.preview.subtitle': '{shown} txartel-lagin {total} txarteleko sorta batetik.',
  'addMore.preview.adjust': '← Doitu',
  'addMore.preview.regenerate': 'Birsortu',
  'addMore.preview.regenerating': 'Birsortzen…',
  'addMore.preview.add': 'Gehitu {count} txartel →',
  'addMore.preview.adding': '{count} gehitzen…',
  'addMore.preview.previewFailed': 'Aurrebistak huts egin du',
  'addMore.preview.generationFailed': 'Sorkuntzak huts egin du',
  'addMore.preview.cardFront': 'Aurrealdea',
  'addMore.preview.cardBack': 'Atzealdea',

  // EditCardModal
  'editCardModal.title': 'Editatu txartela',
  'editCardModal.primary': 'Gorde aldaketak',
  'editCardModal.front': 'Aurrealdea',
  'editCardModal.back': 'Atzealdea',
  'editCardModal.saving': 'Gordetzen…',

  // MarkIssueModal
  'markIssueModal.title': 'Salatu txartel honen arazo bat',
  'markIssueModal.primary': 'Bidali',
  'markIssueModal.descriptionLabel': 'Deskribapena (aukerakoa, "Beste zerbait" ez bada)',
  'markIssueModal.descriptionPlaceholder': 'Txartela gerora konpontzen lagunduko duen edozer.',
  'markIssueModal.saving': 'Gordetzen…',

  // ResolveIssueModal
  'resolveIssueModal.title': 'Konpondu AArekin',
  'resolveIssueModal.generateProposal': 'Sortu proposamena',
  'resolveIssueModal.front': 'Aurrealdea',
  'resolveIssueModal.back': 'Atzealdea',
  'resolveIssueModal.reportedIssue': 'Salatutako arazoa · {type}',
  'resolveIssueModal.noDescription': '(deskribapenik ez)',
  'resolveIssueModal.modelNote':
    '<strong>{model}</strong> erabiliko du (ikasketa sortzeko erabilitako eredua).',
  'resolveIssueModal.asking': 'AAri galdetzen…',
  'resolveIssueModal.saving': 'Gordetzen…',
  'resolveIssueModal.accept': 'Onartu eta aplikatu',
  'resolveIssueModal.proposedFront': 'Proposatutako aurrealdea',
  'resolveIssueModal.proposedBack': 'Proposatutako atzealdea',
  'resolveIssueModal.deleteInstead': 'Hobeto txartela ezabatu',
  'resolveIssueModal.originalNote':
    'Jatorrizkoa goian mantentzen da. Onartu ordezteko edo Utzi alde batera uzteko.',
  'resolveIssueModal.deleteConfirm': '¿Txartel hau ikasketatik ezabatu?',

  // StudyStats
  'stats.activityHeading': 'Jarduera · azken 30 egunak',
  'stats.cardStatusHeading': 'Txartelen egoera',
  'stats.reviewedHeading': 'Berrikusiak · azken 30 egunak',
  'stats.totalReviewed': '{count} guztira',
  'stats.distribution.new': 'Berriak',
  'stats.distribution.learning': 'Ikasten',
  'stats.distribution.learned': 'Ikasita',
  'stats.donutCenterLabel': 'ikasita',
  'stats.donutAria': 'Txartelen egoeraren banaketa',
  'stats.metrics.streak': 'Kateamendua',
  'stats.metrics.streakUnit': '{days} e',
  'stats.metrics.daysStudied': 'Ikasitako egunak (guztira)',
  'stats.metrics.avgActiveDay': 'Batezbestekoa / egun aktiboa',
  'stats.metrics.bestDay': 'Egunik onena',
  'stats.noCards': 'Oraindik ez dago txartelik.',
};
