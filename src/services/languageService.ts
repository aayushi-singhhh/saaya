// Language detection and translation service
export interface LanguageSupport {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string; // For speech synthesis
  rtl: boolean; // Right-to-left languages
}

export const supportedLanguages: Record<string, LanguageSupport> = {
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechCode: 'en-US',
    rtl: false
  },
  'hi': {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    speechCode: 'hi-IN',
    rtl: false
  }
};

// Language detection patterns
const languagePatterns = {
  hi: [
    // Hindi patterns
    'कैसे', 'कैसा', 'कहाँ', 'क्या', 'कौन', 'कब', 'क्यों', 'कितना',
    'मुझे', 'मैं', 'आप', 'हम', 'वे', 'यह', 'वह', 'है', 'हैं', 'था', 'थी',
    'ईमेल', 'संदेश', 'दस्तावेज़', 'फ़ाइल', 'फोटो', 'वीडियो',
    'भेजना', 'भेजें', 'बनाना', 'बनाएं', 'खोलना', 'खोलें', 'सहायता', 'मदद',
    'जीमेल', 'गूगल', 'फेसबुक', 'व्हाट्सएप', 'ट्विटर', 'इंस्टाग्राम',
    'कंप्यूटर', 'लैपटॉप', 'मोबाइल', 'फोन', 'स्क्रीन', 'कीबोर्ड', 'माउस'
  ],
  es: [
    'cómo', 'qué', 'dónde', 'cuándo', 'por qué', 'quién', 'cuál',
    'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos',
    'correo', 'email', 'mensaje', 'documento', 'archivo', 'foto',
    'enviar', 'crear', 'abrir', 'ayuda', 'ayudar', 'escribir', 'leer',
    'gmail', 'google', 'facebook', 'whatsapp', 'twitter', 'instagram',
    'computadora', 'ordenador', 'móvil', 'teléfono', 'pantalla', 'teclado', 'ratón'
  ],
  fr: [
    'comment', 'quoi', 'où', 'quand', 'pourquoi', 'qui', 'quel',
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'email', 'message', 'document', 'fichier', 'photo',
    'envoyer', 'créer', 'ouvrir', 'aide', 'aider', 'écrire', 'lire',
    'gmail', 'google', 'facebook', 'whatsapp', 'twitter', 'instagram',
    'ordinateur', 'portable', 'mobile', 'téléphone', 'écran', 'clavier', 'souris'
  ],
  de: [
    'wie', 'was', 'wo', 'wann', 'warum', 'wer', 'welche',
    'ich', 'du', 'er', 'sie', 'wir', 'ihr', 'sie',
    'email', 'nachricht', 'dokument', 'datei', 'foto',
    'senden', 'erstellen', 'öffnen', 'hilfe', 'helfen', 'schreiben', 'lesen',
    'gmail', 'google', 'facebook', 'whatsapp', 'twitter', 'instagram',
    'computer', 'laptop', 'handy', 'telefon', 'bildschirm', 'tastatur', 'maus'
  ],
  ar: [
    'كيف', 'ماذا', 'أين', 'متى', 'لماذا', 'من', 'أي',
    'أنا', 'أنت', 'هو', 'هي', 'نحن', 'أنتم', 'هم',
    'بريد', 'رسالة', 'وثيقة', 'ملف', 'صورة',
    'إرسال', 'إنشاء', 'فتح', 'مساعدة', 'مساعد', 'كتابة', 'قراءة',
    'جيميل', 'جوجل', 'فيسبوك', 'واتساب', 'تويتر', 'انستغرام',
    'كمبيوتر', 'حاسوب', 'هاتف', 'شاشة', 'لوحة', 'فأرة'
  ],
  zh: [
    '怎么', '什么', '哪里', '什么时候', '为什么', '谁', '哪个',
    '我', '你', '他', '她', '我们', '你们', '他们',
    '电子邮件', '消息', '文档', '文件', '照片',
    '发送', '创建', '打开', '帮助', '帮助', '写', '读',
    '谷歌邮箱', '谷歌', '脸书', '微信', '推特', '微博',
    '电脑', '计算机', '手机', '屏幕', '键盘', '鼠标'
  ],
  ja: [
    'どうやって', '何', 'どこ', 'いつ', 'なぜ', '誰', 'どの',
    '私', 'あなた', '彼', '彼女', '私たち', 'あなたたち', '彼ら',
    'メール', 'メッセージ', '文書', 'ファイル', '写真',
    '送信', '作成', '開く', 'ヘルプ', '助ける', '書く', '読む',
    'ジーメール', 'グーグル', 'フェイスブック', 'ライン', 'ツイッター',
    'コンピューター', 'パソコン', '携帯', '画面', 'キーボード', 'マウス'
  ],
  pt: [
    'como', 'o que', 'onde', 'quando', 'por que', 'quem', 'qual',
    'eu', 'você', 'ele', 'ela', 'nós', 'vocês', 'eles',
    'email', 'mensagem', 'documento', 'arquivo', 'foto',
    'enviar', 'criar', 'abrir', 'ajuda', 'ajudar', 'escrever', 'ler',
    'gmail', 'google', 'facebook', 'whatsapp', 'twitter', 'instagram',
    'computador', 'laptop', 'celular', 'telefone', 'tela', 'teclado', 'mouse'
  ],
  ru: [
    'как', 'что', 'где', 'когда', 'почему', 'кто', 'какой',
    'я', 'ты', 'он', 'она', 'мы', 'вы', 'они',
    'почта', 'сообщение', 'документ', 'файл', 'фото',
    'отправить', 'создать', 'открыть', 'помощь', 'помочь', 'писать', 'читать',
    'гмейл', 'гугл', 'фейсбук', 'ватсап', 'твиттер', 'инстаграм',
    'компьютер', 'ноутбук', 'телефон', 'экран', 'клавиатура', 'мышь'
  ],
  it: [
    'come', 'cosa', 'dove', 'quando', 'perché', 'chi', 'quale',
    'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
    'email', 'messaggio', 'documento', 'file', 'foto',
    'inviare', 'creare', 'aprire', 'aiuto', 'aiutare', 'scrivere', 'leggere',
    'gmail', 'google', 'facebook', 'whatsapp', 'twitter', 'instagram',
    'computer', 'laptop', 'cellulare', 'telefono', 'schermo', 'tastiera', 'mouse'
  ]
};

export function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Score each language based on pattern matches
  const scores: Record<string, number> = {};
  
  for (const [langCode, patterns] of Object.entries(languagePatterns)) {
    scores[langCode] = 0;
    for (const pattern of patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        scores[langCode] += 1;
      }
    }
  }
  
  // Find the language with the highest score
  let detectedLang = 'en'; // Default to English
  let maxScore = 0;
  
  for (const [langCode, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = langCode;
    }
  }
  
  // If no patterns matched, try to detect by character sets
  if (maxScore === 0) {
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari (Hindi)
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese characters
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Japanese
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'; // Korean
  }
  
  return detectedLang;
}

// Predefined translations for common tutorial phrases
export const translations: Record<string, Record<string, string>> = {
  'Please start screen sharing first to use voice commands.': {
    hi: 'वॉयस कमांड का उपयोग करने के लिए पहले स्क्रीन शेयरिंग शुरू करें।',
    es: 'Por favor inicie el uso compartido de pantalla primero para usar comandos de voz.',
    fr: 'Veuillez d\'abord démarrer le partage d\'écran pour utiliser les commandes vocales.',
    de: 'Bitte starten Sie zuerst die Bildschirmfreigabe, um Sprachbefehle zu verwenden.',
    ar: 'يرجى بدء مشاركة الشاشة أولاً لاستخدام الأوامر الصوتية.',
    zh: '请先开始屏幕共享以使用语音命令。',
    ja: '音声コマンドを使用するには、まず画面共有を開始してください。',
    pt: 'Por favor, inicie o compartilhamento de tela primeiro para usar comandos de voz.',
    ru: 'Пожалуйста, сначала начните демонстрацию экрана для использования голосовых команд.',
    it: 'Si prega di iniziare prima la condivisione dello schermo per utilizzare i comandi vocali.'
  },
  'Click Compose Button': {
    hi: 'कंपोज़ बटन पर क्लिक करें',
    es: 'Haga clic en el botón Redactar',
    fr: 'Cliquez sur le bouton Composer',
    de: 'Klicken Sie auf die Schaltfläche Verfassen',
    ar: 'انقر على زر إنشاء',
    zh: '点击撰写按钮',
    ja: '作成ボタンをクリック',
    pt: 'Clique no botão Compor',
    ru: 'Нажмите кнопку Создать',
    it: 'Fare clic sul pulsante Componi'
  },
  'Enter Recipient Email': {
    hi: 'प्राप्तकर्ता का ईमेल दर्ज करें',
    es: 'Ingrese el email del destinatario',
    fr: 'Entrez l\'email du destinataire',
    de: 'Empfänger-E-Mail eingeben',
    ar: 'أدخل بريد المستلم الإلكتروني',
    zh: '输入收件人电子邮件',
    ja: '受信者のメールを入力',
    pt: 'Digite o email do destinatário',
    ru: 'Введите email получателя',
    it: 'Inserisci l\'email del destinatario'
  },
  'Add Email Subject': {
    hi: 'ईमेल विषय जोड़ें',
    es: 'Agregar asunto del email',
    fr: 'Ajouter le sujet de l\'email',
    de: 'E-Mail-Betreff hinzufügen',
    ar: 'إضافة موضوع البريد الإلكتروني',
    zh: '添加电子邮件主题',
    ja: 'メールの件名を追加',
    pt: 'Adicionar assunto do email',
    ru: 'Добавить тему письма',
    it: 'Aggiungi oggetto email'
  },
  'Write Your Message': {
    hi: 'अपना संदेश लिखें',
    es: 'Escriba su mensaje',
    fr: 'Écrivez votre message',
    de: 'Schreiben Sie Ihre Nachricht',
    ar: 'اكتب رسالتك',
    zh: '写您的消息',
    ja: 'メッセージを書いてください',
    pt: 'Escreva sua mensagem',
    ru: 'Напишите ваше сообщение',
    it: 'Scrivi il tuo messaggio'
  },
  'Send the Email': {
    hi: 'ईमेल भेजें',
    es: 'Enviar el email',
    fr: 'Envoyer l\'email',
    de: 'E-Mail senden',
    ar: 'إرسال البريد الإلكتروني',
    zh: '发送电子邮件',
    ja: 'メールを送信',
    pt: 'Enviar o email',
    ru: 'Отправить письмо',
    it: 'Invia l\'email'
  },
  '👆 Click on the highlighted area': {
    hi: '👆 हाइलाइट किए गए क्षेत्र पर क्लिक करें',
    es: '👆 Haga clic en el área resaltada',
    fr: '👆 Cliquez sur la zone surlignée',
    de: '👆 Klicken Sie auf den hervorgehobenen Bereich',
    ar: '👆 انقر على المنطقة المميزة',
    zh: '👆 点击高亮显示的区域',
    ja: '👆 ハイライトされた領域をクリック',
    pt: '👆 Clique na área destacada',
    ru: '👆 Нажмите на выделенную область',
    it: '👆 Fai clic sull\'area evidenziata'
  },
  '⌨️ Type in the highlighted field': {
    hi: '⌨️ हाइलाइट किए गए फ़ील्ड में टाइप करें',
    es: '⌨️ Escriba en el campo resaltado',
    fr: '⌨️ Tapez dans le champ surligné',
    de: '⌨️ Tippen Sie in das hervorgehobene Feld',
    ar: '⌨️ اكتب في الحقل المميز',
    zh: '⌨️ 在高亮显示的字段中输入',
    ja: '⌨️ ハイライトされたフィールドに入力',
    pt: '⌨️ Digite no campo destacado',
    ru: '⌨️ Введите в выделенное поле',
    it: '⌨️ Digita nel campo evidenziato'
  },
  '✅ I Did This Step': {
    hi: '✅ मैंने यह चरण पूरा किया',
    es: '✅ Completé este paso',
    fr: '✅ J\'ai fait cette étape',
    de: '✅ Ich habe diesen Schritt gemacht',
    ar: '✅ لقد أكملت هذه الخطوة',
    zh: '✅ 我完成了这一步',
    ja: '✅ このステップを完了しました',
    pt: '✅ Eu fiz este passo',
    ru: '✅ Я выполнил этот шаг',
    it: '✅ Ho fatto questo passaggio'
  },
  'Skip': {
    hi: 'छोड़ें',
    es: 'Omitir',
    fr: 'Passer',
    de: 'Überspringen',
    ar: 'تخطي',
    zh: '跳过',
    ja: 'スキップ',
    pt: 'Pular',
    ru: 'Пропустить',
    it: 'Salta'
  },
  'Look on the LEFT side of your Gmail screen. You\'ll see a button that says "Compose" with a pencil icon or "+" sign. It\'s usually red or blue.': {
    hi: 'अपनी Gmail स्क्रीन के बाईं ओर देखें। आपको "Compose" लिखा हुआ एक बटन दिखेगा जिसमें पेंसिल का आइकन या "+" साइन होगा। यह आमतौर पर लाल या नीले रंग का होता है।',
    es: 'Mire en el lado IZQUIERDO de su pantalla de Gmail. Verá un botón que dice "Redactar" con un ícono de lápiz o signo "+". Suele ser rojo o azul.',
    fr: 'Regardez sur le côté GAUCHE de votre écran Gmail. Vous verrez un bouton qui dit "Composer" avec une icône de crayon ou un signe "+". Il est généralement rouge ou bleu.',
    de: 'Schauen Sie auf die LINKE Seite Ihres Gmail-Bildschirms. Sie sehen eine Schaltfläche mit "Verfassen" mit einem Stift-Symbol oder "+" Zeichen. Sie ist normalerweise rot oder blau.'
  },
  'Sorry, I encountered an error processing your command. Please try again.': {
    hi: 'क्षमा करें, आपकी कमांड को प्रोसेस करने में त्रुटि हुई। कृपया फिर से कोशिश करें।',
    es: 'Lo siento, encontré un error al procesar su comando. Por favor intente de nuevo.',
    fr: 'Désolé, j\'ai rencontré une erreur lors du traitement de votre commande. Veuillez réessayer.',
    de: 'Entschuldigung, beim Verarbeiten Ihres Befehls ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    ar: 'آسف، واجهت خطأ في معالجة أمرك. يرجى المحاولة مرة أخرى.',
    zh: '抱歉，处理您的命令时遇到错误。请重试。',
    ja: '申し訳ありませんが、コマンドの処理中にエラーが発生しました。もう一度お試しください。',
    pt: 'Desculpe, encontrei um erro ao processar seu comando. Tente novamente.',
    ru: 'Извините, произошла ошибка при обработке вашей команды. Попробуйте снова.',
    it: 'Spiacente, ho riscontrato un errore nell\'elaborazione del tuo comando. Riprova.'
  },
  'To [TASK], let\'s first navigate to [WEBSITE]. Please open your browser and go to [URL]': {
    hi: '[TASK] के लिए, पहले [WEBSITE] पर जाते हैं। कृपया अपना ब्राउज़र खोलें और [URL] पर जाएं',
    es: 'Para [TASK], primero vayamos a [WEBSITE]. Abra su navegador y vaya a [URL]',
    fr: 'Pour [TASK], naviguons d\'abord vers [WEBSITE]. Veuillez ouvrir votre navigateur et aller à [URL]',
    de: 'Um [TASK], navigieren wir zuerst zu [WEBSITE]. Öffnen Sie Ihren Browser und gehen Sie zu [URL]',
    ar: 'لـ [TASK]، دعنا ننتقل أولاً إلى [WEBSITE]. يرجى فتح متصفحك والذهاب إلى [URL]',
    zh: '要[TASK]，让我们首先导航到[WEBSITE]。请打开您的浏览器并转到[URL]',
    ja: '[TASK]をするために、まず[WEBSITE]に移動しましょう。ブラウザを開いて[URL]にアクセスしてください'
  },
  'Navigate to [WEBSITE]': {
    hi: '[WEBSITE] पर जाएं',
    es: 'Navegar a [WEBSITE]',
    fr: 'Naviguer vers [WEBSITE]',
    de: 'Zu [WEBSITE] navigieren',
    ar: 'انتقل إلى [WEBSITE]',
    zh: '导航到[WEBSITE]',
    ja: '[WEBSITE]に移動'
  },
  'Open [URL]': {
    hi: '[URL] खोलें',
    es: 'Abrir [URL]',
    fr: 'Ouvrir [URL]',
    de: '[URL] öffnen',
    ar: 'افتح [URL]',
    zh: '打开[URL]',
    ja: '[URL]を開く'
  }
};

export function translateText(text: string, targetLanguage: string, substitutions?: Record<string, string>): string {
  if (targetLanguage === 'en') return text;
  
  // Check if we have a predefined translation
  if (translations[text] && translations[text][targetLanguage]) {
    let translatedText = translations[text][targetLanguage];
    
    // Apply substitutions if provided
    if (substitutions) {
      Object.entries(substitutions).forEach(([placeholder, value]) => {
        translatedText = translatedText.replace(`[${placeholder}]`, value);
      });
    }
    
    return translatedText;
  }
  
  // Handle dynamic substitutions in the original text
  if (substitutions) {
    let processedText = text;
    Object.entries(substitutions).forEach(([placeholder, value]) => {
      processedText = processedText.replace(`[${placeholder}]`, value);
    });
    
    // Try to find the template pattern
    const templateKey = Object.keys(translations).find(key => {
      const pattern = key.replace(/\[[^\]]+\]/g, '\\[\\w+\\]');
      return new RegExp(pattern).test(text);
    });
    
    if (templateKey && translations[templateKey] && translations[templateKey][targetLanguage]) {
      let translatedText = translations[templateKey][targetLanguage];
      Object.entries(substitutions).forEach(([placeholder, value]) => {
        translatedText = translatedText.replace(`[${placeholder}]`, value);
      });
      return translatedText;
    }
    
    return processedText;
  }
  
  // If no predefined translation, return original text
  // In a real implementation, you'd call a translation API here
  return text;
}

export function getLanguageFromText(text: string): LanguageSupport {
  const detectedCode = detectLanguage(text);
  return supportedLanguages[detectedCode] || supportedLanguages['en'];
}
