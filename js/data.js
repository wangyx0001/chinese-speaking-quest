/* ============================================================
   STORY & VOCABULARY DATA — the only file you need to edit!

   Each word looks like:
     { hanzi: '狗', pinyin: 'gǒu', en: 'dog', emoji: '🐶', also: ['够'] }

   - hanzi  : what the speech recognizer should hear (Chinese characters)
   - pinyin : shown big on screen (kids read this)
   - en     : small English hint
   - emoji  : the picture
   - also   : EXTRA ACCEPTED ANSWERS. The recognizer often mis-hears kids —
              open the browser console (F12) while she plays and watch the
              lines that start with [heard]. If her good attempts show up as
              a different character (e.g. 妈 when she said 马), add that
              character here and the game will accept it next time!

   Each chapter also has a "finale" — a short magic phrase using words she
   just practiced. bg is the scene's background gradient, deco is the
   scenery emoji, sticker is the reward for finishing the chapter.
   ============================================================ */

window.STORIES = [

  /* ==================== STORY 1: RED PANDY ==================== */
  {
    id: 'panda',
    title: '潘迪回家',
    titleEn: 'Red Pandy Goes Home',
    tagline: 'Red Pandy is lost! Speak Chinese to help her travel home to Bamboo Mountain.',
    // img: a picture file in this folder used instead of the emoji everywhere
    hero: { name: '潘迪', emoji: '🦝', img: 'redpanda icon.png' },
    ending: { zh: '潘迪到家了！谢谢你！', en: 'Red Pandy made it home! The whole red panda family is together again — thanks to YOU!' },
    chapters: [
      {
        id: 'panda-greetings',
        title: '你好村', titleEn: 'Hello Village', emoji: '🏡', sticker: '👋',
        bg: 'linear-gradient(180deg,#aee9ff,#d4f7c5)', deco: '🏡🌳',
        intro: { en: 'Red Pandy meets friendly villagers! Say hello in Chinese to make friends for her.', zh: '潘迪遇到了友好的村民！说你好，帮她交朋友吧！' },
        words: [
          { hanzi: '你好', pinyin: 'nǐ hǎo', en: 'hello', emoji: '👋', also: [] },
          { hanzi: '谢谢', pinyin: 'xiè xie', en: 'thank you', emoji: '🙏', also: [] },
          { hanzi: '再见', pinyin: 'zài jiàn', en: 'goodbye', emoji: '🫡', also: ['在见'] },
          { hanzi: '请', pinyin: 'qǐng', en: 'please', emoji: '🤲', also: ['清', '情', '青'] },
          { hanzi: '好', pinyin: 'hǎo', en: 'good / OK', emoji: '👍', also: ['号', '郝'] },
          { hanzi: '我是潘迪', pinyin: 'wǒ shì Pān dí', en: 'I am Red Pandy', emoji: '🦝', img: 'redpanda icon.png', also: ['潘迪', '我是', '胖迪', '盼盼'] },
        ],
        finale: { hanzi: '你好，谢谢你！', pinyin: 'nǐ hǎo, xiè xie nǐ!', en: 'Hello, thank you!', emoji: '🎉', also: ['你好', '谢谢'] },
      },
      {
        id: 'panda-animals',
        title: '快乐农场', titleEn: 'Happy Farm', emoji: '🚜', sticker: '🐶',
        bg: 'linear-gradient(180deg,#bfe9ff,#f5e5a3)', deco: '🚜🌾',
        intro: { en: 'The farm animals are hiding in the barn! Call their names in Chinese and they will come out to play.', zh: '小动物们躲在谷仓里！叫它们的名字，它们就会出来玩！' },
        words: [
          { hanzi: '狗', pinyin: 'gǒu', en: 'dog', emoji: '🐶', also: ['够'] },
          { hanzi: '猫', pinyin: 'māo', en: 'cat', emoji: '🐱', also: ['毛', '帽'] },
          { hanzi: '鸡', pinyin: 'jī', en: 'chicken', emoji: '🐔', also: ['机', '几', '急'] },
          { hanzi: '鸭子', pinyin: 'yā zi', en: 'duck', emoji: '🦆', also: ['鸭', '压'] },
          { hanzi: '马', pinyin: 'mǎ', en: 'horse', emoji: '🐴', also: ['妈', '吗', '码'] },
          { hanzi: '牛', pinyin: 'niú', en: 'cow', emoji: '🐮', also: ['纽'] },
          { hanzi: '猪', pinyin: 'zhū', en: 'pig', emoji: '🐷', also: ['珠', '朱', '住'] },
          { hanzi: '羊', pinyin: 'yáng', en: 'sheep', emoji: '🐑', also: ['阳', '洋', '样'] },
        ],
        finale: { hanzi: '我爱小狗！', pinyin: 'wǒ ài xiǎo gǒu!', en: 'I love the puppy!', emoji: '🥰', also: ['小狗', '我爱'] },
      },
      {
        id: 'panda-colors',
        title: '彩虹桥', titleEn: 'Rainbow Bridge', emoji: '🌈', sticker: '🌈',
        bg: 'linear-gradient(180deg,#c8ecff,#e8d5ff)', deco: '🌈☁️',
        intro: { en: 'The rainbow bridge lost its colors! Say each color in Chinese to paint it back so Red Pandy can cross.', zh: '彩虹桥没有颜色了！说出每个颜色，把桥画回来，潘迪才能过桥！' },
        words: [
          { hanzi: '红色', pinyin: 'hóng sè', en: 'red', emoji: '❤️', also: ['红'] },
          { hanzi: '橙色', pinyin: 'chéng sè', en: 'orange', emoji: '🧡', also: ['橙', '成色'] },
          { hanzi: '黄色', pinyin: 'huáng sè', en: 'yellow', emoji: '💛', also: ['黄'] },
          { hanzi: '绿色', pinyin: 'lǜ sè', en: 'green', emoji: '💚', also: ['绿'] },
          { hanzi: '蓝色', pinyin: 'lán sè', en: 'blue', emoji: '💙', also: ['蓝', '兰色'] },
          { hanzi: '紫色', pinyin: 'zǐ sè', en: 'purple', emoji: '💜', also: ['紫', '子色'] },
          { hanzi: '粉色', pinyin: 'fěn sè', en: 'pink', emoji: '🩷', also: ['粉', '分色'] },
        ],
        finale: { hanzi: '我喜欢红色！', pinyin: 'wǒ xǐ huan hóng sè!', en: 'I like red!', emoji: '😍', also: ['喜欢', '红色'] },
      },
      {
        id: 'panda-numbers',
        title: '数字河', titleEn: 'Number River', emoji: '🌊', sticker: '🔟',
        bg: 'linear-gradient(180deg,#b3e5fc,#81d4fa)', deco: '🌊🐟',
        intro: { en: 'Red Pandy must cross the river! Count in Chinese — every number makes a stepping stone appear.', zh: '潘迪要过河！一起数数，每个数字都会变出一块踏脚石！' },
        words: [
          { hanzi: '一', pinyin: 'yī', en: 'one', emoji: '1️⃣', also: ['1', '衣', '医'] },
          { hanzi: '二', pinyin: 'èr', en: 'two', emoji: '2️⃣', also: ['2', '儿'] },
          { hanzi: '三', pinyin: 'sān', en: 'three', emoji: '3️⃣', also: ['3', '山', '伞'] },
          { hanzi: '四', pinyin: 'sì', en: 'four', emoji: '4️⃣', also: ['4', '是', '事'] },
          { hanzi: '五', pinyin: 'wǔ', en: 'five', emoji: '5️⃣', also: ['5', '舞', '午'] },
          { hanzi: '六', pinyin: 'liù', en: 'six', emoji: '6️⃣', also: ['6', '留', '流'] },
          { hanzi: '七', pinyin: 'qī', en: 'seven', emoji: '7️⃣', also: ['7', '气', '期'] },
          { hanzi: '八', pinyin: 'bā', en: 'eight', emoji: '8️⃣', also: ['8', '吧', '爸'] },
          { hanzi: '九', pinyin: 'jiǔ', en: 'nine', emoji: '9️⃣', also: ['9', '酒', '就'] },
          { hanzi: '十', pinyin: 'shí', en: 'ten', emoji: '🔟', also: ['10', '时', '石'] },
        ],
        finale: { hanzi: '一二三，跳！', pinyin: 'yī èr sān, tiào!', en: '1, 2, 3, jump!', emoji: '🦘', also: ['一二三', '123', '跳'] },
      },
      {
        id: 'panda-food',
        title: '大市场', titleEn: 'Big Market', emoji: '🧺', sticker: '🍎',
        bg: 'linear-gradient(180deg,#ffe0b2,#ffccbc)', deco: '🏪🍉',
        intro: { en: 'Red Pandy is SO hungry! Order yummy food in Chinese to fill her picnic basket.', zh: '潘迪好饿呀！点好吃的，装满她的野餐篮子！' },
        words: [
          { hanzi: '苹果', pinyin: 'píng guǒ', en: 'apple', emoji: '🍎', also: ['苹', '平果'] },
          { hanzi: '香蕉', pinyin: 'xiāng jiāo', en: 'banana', emoji: '🍌', also: ['香', '蕉'] },
          { hanzi: '西瓜', pinyin: 'xī guā', en: 'watermelon', emoji: '🍉', also: ['西', '瓜'] },
          { hanzi: '米饭', pinyin: 'mǐ fàn', en: 'rice', emoji: '🍚', also: ['米', '饭'] },
          { hanzi: '面条', pinyin: 'miàn tiáo', en: 'noodles', emoji: '🍜', also: ['面', '条'] },
          { hanzi: '包子', pinyin: 'bāo zi', en: 'steamed bun', emoji: '🥟', also: ['包', '抱'] },
          { hanzi: '牛奶', pinyin: 'niú nǎi', en: 'milk', emoji: '🥛', also: ['牛', '奶'] },
          { hanzi: '水', pinyin: 'shuǐ', en: 'water', emoji: '💧', also: ['谁', '睡'] },
        ],
        finale: { hanzi: '我要苹果，谢谢！', pinyin: 'wǒ yào píng guǒ, xiè xie!', en: 'I want an apple, thank you!', emoji: '😋', also: ['苹果', '我要'] },
      },
      {
        id: 'panda-weather',
        title: '天气山', titleEn: 'Weather Mountain', emoji: '⛰️', sticker: '☀️',
        bg: 'linear-gradient(180deg,#90caf9,#e1f5fe)', deco: '⛰️☁️',
        intro: { en: 'The mountain weather is going wild! Say the weather words in Chinese to calm the sky.', zh: '山上的天气变来变去！说出天气词，让天空安静下来！' },
        words: [
          { hanzi: '太阳', pinyin: 'tài yáng', en: 'sun', emoji: '☀️', also: ['太', '阳'] },
          { hanzi: '下雨', pinyin: 'xià yǔ', en: 'raining', emoji: '🌧️', also: ['雨'] },
          { hanzi: '下雪', pinyin: 'xià xuě', en: 'snowing', emoji: '❄️', also: ['雪'] },
          { hanzi: '云', pinyin: 'yún', en: 'cloud', emoji: '☁️', also: ['运', '晕'] },
          { hanzi: '风', pinyin: 'fēng', en: 'wind', emoji: '💨', also: ['封', '疯', '丰'] },
          { hanzi: '热', pinyin: 'rè', en: 'hot', emoji: '🥵', also: ['乐', '日'] },
          { hanzi: '冷', pinyin: 'lěng', en: 'cold', emoji: '🥶', also: ['愣'] },
        ],
        finale: { hanzi: '今天太阳出来了！', pinyin: 'jīn tiān tài yáng chū lái le!', en: 'The sun came out today!', emoji: '🌞', also: ['太阳', '出来了', '今天'] },
      },
      {
        id: 'panda-family',
        title: '竹子山', titleEn: 'Bamboo Mountain', emoji: '🎋', sticker: '🏠',
        bg: 'linear-gradient(180deg,#c8e6c9,#a5d6a7)', deco: '🎋🎍',
        intro: { en: 'Red Pandy is home! Call each family member out of the bamboo for the biggest red panda hug ever.', zh: '潘迪到家啦！把每个家人叫出来，抱一个大大的抱抱！' },
        words: [
          { hanzi: '妈妈', pinyin: 'mā ma', en: 'mom', emoji: '👩', also: ['马', '吗'] },
          { hanzi: '爸爸', pinyin: 'bà ba', en: 'dad', emoji: '👨', also: ['八', '吧'] },
          { hanzi: '爷爷', pinyin: 'yé ye', en: 'grandpa', emoji: '👴', also: ['也', '叶'] },
          { hanzi: '奶奶', pinyin: 'nǎi nai', en: 'grandma', emoji: '👵', also: ['乃'] },
          { hanzi: '哥哥', pinyin: 'gē ge', en: 'big brother', emoji: '👦', also: ['歌', '格'] },
          { hanzi: '妹妹', pinyin: 'mèi mei', en: 'little sister', emoji: '👧', also: ['美', '没'] },
          { hanzi: '家', pinyin: 'jiā', en: 'home / family', emoji: '🏠', also: ['加', '佳'] },
        ],
        finale: { hanzi: '妈妈，我爱你！', pinyin: 'mā ma, wǒ ài nǐ!', en: 'Mom, I love you!', emoji: '💗', also: ['我爱你', '妈妈'] },
      },
    ],
  },

  /* ==================== STORY 2: PUPPY RESCUE SQUAD ==================== */
  {
    id: 'pups',
    title: '汪汪救援队',
    titleEn: 'Puppy Rescue Squad',
    tagline: 'Fly with Skye! Speak Chinese to launch vehicles and save the day.',
    hero: { name: '天天', emoji: '🐕', img: 'Skye-thumbnail.png' },
    ending: { zh: '任务完成！天天和小猫都为你欢呼！你是真正的救援英雄！', en: 'Mission complete! The kitten is safe — Skye and the whole squad cheer for YOU!' },
    chapters: [
      {
        id: 'pups-hq',
        title: '救援基地', titleEn: 'Rescue HQ', emoji: '🗼', sticker: '📣',
        bg: 'linear-gradient(180deg,#b3e5fc,#ffe082)', deco: '🗼📡',
        intro: { en: 'Welcome to Rescue HQ! Skye is here to teach you the squad commands — every word makes a pup slide down the fire pole!', zh: '欢迎来到救援基地！天天教你小队口令，每说一个口令，就有一只小狗滑下消防杆！' },
        words: [
          { hanzi: '你好', pinyin: 'nǐ hǎo', en: 'hello', emoji: '👋', also: [] },
          { hanzi: '出发', pinyin: 'chū fā', en: "let's roll!", emoji: '🚀', also: ['出', '发', '初发'] },
          { hanzi: '快', pinyin: 'kuài', en: 'fast!', emoji: '⚡', also: ['筷', '块'] },
          { hanzi: '帮忙', pinyin: 'bāng máng', en: 'help', emoji: '🤝', also: ['帮', '忙'] },
          { hanzi: '加油', pinyin: 'jiā yóu', en: 'go go go!', emoji: '💪', also: ['加', '油'] },
          { hanzi: '汪汪', pinyin: 'wāng wāng', en: 'woof woof!', emoji: '🐶', also: ['王', '网', '汪'] },
        ],
        finale: { hanzi: '汪汪队，出发！', pinyin: 'wāng wāng duì, chū fā!', en: "Puppy squad, let's roll!", emoji: '🎖️', also: ['汪汪队', '出发', '汪汪'] },
      },
      {
        id: 'pups-vehicles',
        title: '交通工具', titleEn: 'Vehicle Garage', emoji: '🚒', sticker: '🚒',
        bg: 'linear-gradient(180deg,#cfd8dc,#b0bec5)', deco: '🏁🔧',
        intro: { en: 'Time to launch the rescue vehicles! Name each one in Chinese and watch it zoom out of the garage.', zh: '该出动救援车啦！说出每辆车的名字，看它冲出车库！' },
        words: [
          { hanzi: '车', pinyin: 'chē', en: 'car', emoji: '🚗', also: ['扯'] },
          { hanzi: '消防车', pinyin: 'xiāo fáng chē', en: 'fire truck', emoji: '🚒', also: ['消防'] },
          { hanzi: '警车', pinyin: 'jǐng chē', en: 'police car', emoji: '🚓', also: ['警察'] },
          { hanzi: '飞机', pinyin: 'fēi jī', en: 'airplane', emoji: '✈️', also: ['飞', '机'] },
          { hanzi: '直升机', pinyin: 'zhí shēng jī', en: 'helicopter', emoji: '🚁', also: ['直升'] },
          { hanzi: '船', pinyin: 'chuán', en: 'boat', emoji: '🚤', also: ['穿', '传', '川'] },
          { hanzi: '自行车', pinyin: 'zì xíng chē', en: 'bicycle', emoji: '🚲', also: ['自行', '单车'] },
        ],
        finale: { hanzi: '我开消防车！', pinyin: 'wǒ kāi xiāo fáng chē!', en: "I'm driving the fire truck!", emoji: '🧑‍🚒', also: ['消防车', '我开'] },
      },
      {
        id: 'pups-actions',
        title: '动作训练', titleEn: 'Action Training', emoji: '🏃', sticker: '🏅',
        bg: 'linear-gradient(180deg,#dcedc8,#aed581)', deco: '🚧🎯',
        intro: { en: 'Rescue pups need training! Shout each action in Chinese and Skye will do it.', zh: '救援小狗要训练！大声喊出动作，天天就会做！' },
        words: [
          { hanzi: '跑', pinyin: 'pǎo', en: 'run', emoji: '🏃', also: ['袍', '抛'] },
          { hanzi: '跳', pinyin: 'tiào', en: 'jump', emoji: '🦘', also: ['条', '调'] },
          { hanzi: '飞', pinyin: 'fēi', en: 'fly', emoji: '🕊️', also: ['非', '菲'] },
          { hanzi: '游泳', pinyin: 'yóu yǒng', en: 'swim', emoji: '🏊', also: ['游', '泳'] },
          { hanzi: '找', pinyin: 'zhǎo', en: 'find', emoji: '🔍', also: ['照', '赵'] },
          { hanzi: '救', pinyin: 'jiù', en: 'rescue', emoji: '🆘', also: ['就', '旧', '九'] },
          { hanzi: '停', pinyin: 'tíng', en: 'stop', emoji: '✋', also: ['听', '庭'] },
        ],
        finale: { hanzi: '快跑，快跳！', pinyin: 'kuài pǎo, kuài tiào!', en: 'Run fast, jump high!', emoji: '💨', also: ['快跑', '快跳'] },
      },
      {
        id: 'pups-city',
        title: '城市搜索', titleEn: 'City Search', emoji: '🗺️', sticker: '🐱',
        bg: 'linear-gradient(180deg,#e1f5fe,#ffe0e0)', deco: '🏙️🔦',
        intro: { en: 'A kitten is lost in the city! Say each place in Chinese to send Skye to search it. Where can she be?', zh: '小猫在城市里走丢了！说出每个地方，派天天去找一找。小猫会在哪里呢？' },
        words: [
          { hanzi: '山', pinyin: 'shān', en: 'mountain', emoji: '⛰️', also: ['三', '衫'] },
          { hanzi: '海', pinyin: 'hǎi', en: 'sea', emoji: '🌊', also: ['还', '嗨'] },
          { hanzi: '学校', pinyin: 'xué xiào', en: 'school', emoji: '🏫', also: ['学', '校'] },
          { hanzi: '商店', pinyin: 'shāng diàn', en: 'store', emoji: '🏪', also: ['商', '店'] },
          { hanzi: '家', pinyin: 'jiā', en: 'home', emoji: '🏠', also: ['加', '佳'] },
          { hanzi: '公园', pinyin: 'gōng yuán', en: 'park', emoji: '🌳', also: ['公', '园'] },
        ],
        finale: { hanzi: '小猫在公园！', pinyin: 'xiǎo māo zài gōng yuán!', en: 'The kitten is in the park!', emoji: '🐱', also: ['公园', '小猫'] },
      },
      {
        id: 'pups-rescue',
        title: '大救援', titleEn: 'The Big Rescue', emoji: '🚁', sticker: '🎖️',
        bg: 'linear-gradient(180deg,#81d4fa,#4fc3f7)', deco: '🚁🌲',
        intro: { en: "The kitten is stuck in a tall tree! Guide Skye's helicopter with Chinese words — up, down, left, right!", zh: '小猫被困在大树上！用中文指挥天天的直升机，上，下，左，右！' },
        words: [
          { hanzi: '大', pinyin: 'dà', en: 'big', emoji: '🐘', also: ['打', '答'] },
          { hanzi: '小', pinyin: 'xiǎo', en: 'small', emoji: '🐭', also: ['笑', '校'] },
          { hanzi: '上', pinyin: 'shàng', en: 'up', emoji: '⬆️', also: ['伤', '商'] },
          { hanzi: '下', pinyin: 'xià', en: 'down', emoji: '⬇️', also: ['吓', '夏'] },
          { hanzi: '左', pinyin: 'zuǒ', en: 'left', emoji: '⬅️', also: ['做', '坐', '昨'] },
          { hanzi: '右', pinyin: 'yòu', en: 'right', emoji: '➡️', also: ['有', '又', '由'] },
        ],
        finale: { hanzi: '我们救了小猫！', pinyin: 'wǒ men jiù le xiǎo māo!', en: 'We saved the kitten!', emoji: '🏆', also: ['救了', '小猫', '我们'] },
      },
    ],
  },

  /* ==================== STORY 3: THE PRINCESS'S CROWN ==================== */
  {
    id: 'princess',
    title: '小公主的皇冠',
    titleEn: "The Princess's Crown",
    tagline: 'A magic wind scattered the crown jewels! Speak kind Chinese words to win them back.',
    hero: { name: '小公主', emoji: '👸', img: 'princess icon.png' },
    ending: { zh: '皇冠完成了！你是最棒的小公主！', en: 'The crown is complete! The kingdom cheers — and the dragon is your friend forever!' },
    chapters: [
      {
        id: 'princess-palace',
        title: '皇宫', titleEn: 'The Palace', emoji: '🏰', sticker: '💎',
        bg: 'linear-gradient(180deg,#f8bbd0,#fce4ec)', deco: '🏰✨',
        intro: { en: 'The palace doors are sealed by magic! Only polite words can open them. Say each one in Chinese!', zh: '皇宫的门被魔法锁住了！只有礼貌的话才能打开，说说看吧！' },
        words: [
          { hanzi: '你好', pinyin: 'nǐ hǎo', en: 'hello', emoji: '👋', also: [] },
          { hanzi: '请', pinyin: 'qǐng', en: 'please', emoji: '🤲', also: ['清', '情'] },
          { hanzi: '谢谢', pinyin: 'xiè xie', en: 'thank you', emoji: '🙏', also: [] },
          { hanzi: '对不起', pinyin: 'duì bu qǐ', en: 'sorry', emoji: '😔', also: ['对不', '对'] },
          { hanzi: '没关系', pinyin: 'méi guān xi', en: "it's okay", emoji: '🤗', also: ['没关', '关系'] },
          { hanzi: '公主', pinyin: 'gōng zhǔ', en: 'princess', emoji: '👸', also: ['宫主'] },
        ],
        finale: { hanzi: '谢谢你，小公主！', pinyin: 'xiè xie nǐ, xiǎo gōng zhǔ!', en: 'Thank you, little princess!', emoji: '💎', also: ['谢谢你', '小公主', '公主'] },
      },
      {
        id: 'princess-wardrobe',
        title: '魔法衣橱', titleEn: 'Magic Wardrobe', emoji: '👗', sticker: '👗',
        bg: 'linear-gradient(180deg,#e1bee7,#f3e5f5)', deco: '🪞🎀',
        intro: { en: 'Time to dress up for the royal ball! Say each item in Chinese and it flies out of the magic wardrobe.', zh: '该为皇家舞会打扮啦！说出每样东西，它就会从魔法衣橱里飞出来！' },
        words: [
          { hanzi: '裙子', pinyin: 'qún zi', en: 'dress', emoji: '👗', also: ['群', '裙'] },
          { hanzi: '鞋子', pinyin: 'xié zi', en: 'shoes', emoji: '👠', also: ['鞋', '写字'] },
          { hanzi: '帽子', pinyin: 'mào zi', en: 'hat', emoji: '👒', also: ['帽', '毛'] },
          { hanzi: '王冠', pinyin: 'wáng guān', en: 'crown', emoji: '👑', also: ['王', '冠', '皇冠'] },
          { hanzi: '手套', pinyin: 'shǒu tào', en: 'gloves', emoji: '🧤', also: ['手', '套'] },
          { hanzi: '项链', pinyin: 'xiàng liàn', en: 'necklace', emoji: '📿', also: ['项', '链'] },
        ],
        finale: { hanzi: '我爱我的裙子！', pinyin: 'wǒ ài wǒ de qún zi!', en: 'I love my dress!', emoji: '💃', also: ['裙子', '我的裙子'] },
      },
      {
        id: 'princess-mirror',
        title: '魔镜', titleEn: 'Magic Mirror', emoji: '🪞', sticker: '🪞',
        bg: 'linear-gradient(180deg,#d1c4e9,#ede7f6)', deco: '🪞⭐',
        intro: { en: 'The magic mirror wants to meet you! Say each body part in Chinese and it lights up with sparkles.', zh: '魔镜想认识你！说出身体部位，它就会亮闪闪！' },
        words: [
          { hanzi: '头', pinyin: 'tóu', en: 'head', emoji: '🙂', also: ['投', '偷'] },
          { hanzi: '眼睛', pinyin: 'yǎn jing', en: 'eyes', emoji: '👀', also: ['眼', '眼镜'] },
          { hanzi: '耳朵', pinyin: 'ěr duo', en: 'ears', emoji: '👂', also: ['耳', '二朵'] },
          { hanzi: '鼻子', pinyin: 'bí zi', en: 'nose', emoji: '👃', also: ['鼻', '笔'] },
          { hanzi: '嘴巴', pinyin: 'zuǐ ba', en: 'mouth', emoji: '👄', also: ['嘴', '最'] },
          { hanzi: '手', pinyin: 'shǒu', en: 'hands', emoji: '🤲', also: ['首', '受'] },
          { hanzi: '脚', pinyin: 'jiǎo', en: 'feet', emoji: '🦶', also: ['角', '叫'] },
        ],
        finale: { hanzi: '我的眼睛大大的！', pinyin: 'wǒ de yǎn jing dà dà de!', en: 'My eyes are so big!', emoji: '✨', also: ['眼睛', '大大的'] },
      },
      {
        id: 'princess-teaparty',
        title: '皇家茶会', titleEn: 'Royal Tea Party', emoji: '🫖', sticker: '🍰',
        bg: 'linear-gradient(180deg,#ffe0f0,#fff3e0)', deco: '🫖🧚',
        intro: { en: 'The fairies are coming for tea! Say each treat in Chinese to set the royal table.', zh: '小仙女们要来喝茶啦！说出每样点心，摆好皇家餐桌！' },
        words: [
          { hanzi: '茶', pinyin: 'chá', en: 'tea', emoji: '🍵', also: ['查', '差'] },
          { hanzi: '蛋糕', pinyin: 'dàn gāo', en: 'cake', emoji: '🍰', also: ['蛋', '糕'] },
          { hanzi: '饼干', pinyin: 'bǐng gān', en: 'cookie', emoji: '🍪', also: ['饼', '干'] },
          { hanzi: '糖果', pinyin: 'táng guǒ', en: 'candy', emoji: '🍬', also: ['糖'] },
          { hanzi: '草莓', pinyin: 'cǎo méi', en: 'strawberry', emoji: '🍓', also: ['草', '莓'] },
          { hanzi: '果汁', pinyin: 'guǒ zhī', en: 'juice', emoji: '🧃', also: ['果', '汁'] },
        ],
        finale: { hanzi: '请喝茶！', pinyin: 'qǐng hē chá!', en: 'Please have some tea!', emoji: '🫖', also: ['喝茶', '请喝'] },
      },
      {
        id: 'princess-dragon',
        title: '友好的龙', titleEn: 'The Friendly Dragon', emoji: '🐉', sticker: '🐉',
        bg: 'linear-gradient(180deg,#b39ddb,#ffccbc)', deco: '🐉🌋',
        intro: { en: 'A lonely dragon guards the last jewel. Name his feelings in Chinese to show him you understand — and become friends!', zh: '孤单的龙守着最后一颗宝石。说出他的心情，和他做朋友吧！' },
        words: [
          { hanzi: '开心', pinyin: 'kāi xīn', en: 'happy', emoji: '😊', also: ['开', '心'] },
          { hanzi: '难过', pinyin: 'nán guò', en: 'sad', emoji: '😢', also: ['难'] },
          { hanzi: '累', pinyin: 'lèi', en: 'tired', emoji: '😴', also: ['泪', '雷', '类'] },
          { hanzi: '饿', pinyin: 'è', en: 'hungry', emoji: '😋', also: ['恶', '鹅'] },
          { hanzi: '怕', pinyin: 'pà', en: 'scared', emoji: '😨', also: ['爬', '趴'] },
          { hanzi: '爱', pinyin: 'ài', en: 'love', emoji: '❤️', also: ['艾', '矮'] },
        ],
        finale: { hanzi: '我们是好朋友！', pinyin: 'wǒ men shì hǎo péng you!', en: 'We are best friends!', emoji: '🥹', also: ['好朋友', '朋友', '我们是'] },
      },
    ],
  },
];
