export interface Mark {
  id: string;
  recordTime: string;
  timestamp: string;
  timestampSeconds: number;
  contextBefore: string;   // 标记点之前的文字
  contextCurrent: string;  // 标记点所在的句子（高亮显示）
  contextAfter: string;    // 标记点之后的文字
  thought?: string;
  podcastName: string;
  episodeName: string;
  episodeId: string;
}

export interface Episode {
  id: string;
  title: string;
  podcastName: string;
  duration: string;
  durationSeconds: number;
  coverUrl: string;
  marksCount: number;
  transcribing?: boolean;
  transcriptStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export const mockEpisodes: Episode[] = [
  {
    id: '1',
    title: '#418. AI 时代的工业革命镜像',
    podcastName: '跨国串门儿计划',
    duration: '24:48',
    durationSeconds: 1488,
    coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&h=300&fit=crop',
    marksCount: 3,
  },
  {
    id: '2',
    title: 'EP128 对话张一鸣',
    podcastName: '张小珺的播客',
    duration: '58:30',
    durationSeconds: 3510,
    coverUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=300&fit=crop',
    marksCount: 5,
  },
  {
    id: '3',
    title: '硬地骇客 #42',
    podcastName: '硬地骇客',
    duration: '45:20',
    durationSeconds: 2720,
    coverUrl: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=300&h=300&fit=crop',
    marksCount: 0,
    transcribing: true,
  },
];

export const mockMarks: Mark[] = [
  {
    id: '1',
    recordTime: '今天 14:30',
    timestamp: '12:30',
    timestampSeconds: 750,
    contextBefore: '很多人都在讨论人工智能会如何改变世界，但很少有人注意到，历史上其实已经发生过类似的技术革命。',
    contextCurrent: '工业革命初期，工人的生活水平反而下降了，这种阵痛期持续了将近两代人。历史学家称之为"恩格斯停顿"，在技术进步的同时，普通人的福祉却在倒退。',
    contextAfter: '这听起来很反直觉对吧？我们总认为技术进步应该让所有人受益，但现实往往更加复杂。',
    thought: '历史总是惊人相似，AI 时代会不会也有这样的阵痛期？',
    podcastName: '跨国串门儿计划',
    episodeName: '#418. AI 时代的工业革命镜像',
    episodeId: '1',
  },
  {
    id: '2',
    recordTime: '今天 10:15',
    timestamp: '23:45',
    timestampSeconds: 1425,
    contextBefore: '很多创业者在早期会犯一个错误，就是过度追求完美。他们会花很长时间去打磨产品的每一个细节。',
    contextCurrent: '当你发现一个机会的时候，最重要的是快速验证，而不是做完美的计划。很多创业者陷入了"分析瘫痪"，花了半年时间做商业计划书，却从来没有真正去测试过市场。',
    contextAfter: '所以我一直强调 MVP 的重要性，先做出来，再迭代。用户的反馈比你的想象更有价值。',
    thought: 'MVP 思维，先做再说',
    podcastName: '张小珺的播客',
    episodeName: 'EP128 对话张一鸣',
    episodeId: '2',
  },
  {
    id: '3',
    recordTime: '昨天 18:20',
    timestamp: '45:12',
    timestampSeconds: 2712,
    contextBefore: '我们生活在一个信息爆炸的时代，每天都有无数的内容在争夺我们的眼球。',
    contextCurrent: '注意力是这个时代最宝贵的资源。每一个产品都在争夺你的注意力，但真正有价值的产品，应该是帮你节省注意力，而不是消耗它。',
    contextAfter: '这就是为什么我一直强调产品要克制，不要为了数据而去设计让用户上瘾的功能。',
    thought: '做产品的终极目标是解放用户，而不是绑架用户',
    podcastName: '张小珺的播客',
    episodeName: 'EP128 对话张一鸣',
    episodeId: '2',
  },
  {
    id: '4',
    recordTime: '昨天 16:05',
    timestamp: '08:22',
    timestampSeconds: 502,
    contextBefore: '新技术的引入会摧毁旧的工作岗位，创造新的工作岗位，但这个过渡期可能会很漫长。',
    contextCurrent: '技术的进步不会自动带来平等，反而可能加剧不平等。掌握新技术的人会获得巨大优势，而无法适应的人会被远远甩在后面。这就是为什么教育如此重要。',
    contextAfter: '那么对于我们个人来说，应该如何应对这样的变化呢？我觉得最重要的是保持学习能力和适应能力。',
    thought: '终身学习不是选择，而是必须',
    podcastName: '跨国串门儿计划',
    episodeName: '#418. AI 时代的工业革命镜像',
    episodeId: '1',
  },
  {
    id: '5',
    recordTime: '2天前 20:40',
    timestamp: '15:30',
    timestampSeconds: 930,
    contextBefore: '很多人问我什么是好的产品设计，我觉得这个问题本身就有点问题。',
    contextCurrent: '好的设计不是让产品看起来很酷，而是让用户感受不到设计的存在。当用户能够毫不费力地完成他们想做的事情时，这就是最好的设计。',
    contextAfter: '乔布斯说过，设计不是外观，设计是它如何工作。我非常认同这一点。',
    podcastName: '张小珺的播客',
    episodeName: 'EP128 对话张一鸣',
    episodeId: '2',
  },
  {
    id: '6',
    recordTime: '3天前 09:15',
    timestamp: '19:45',
    timestampSeconds: 1185,
    contextBefore: '很多人对 AI 感到焦虑，觉得明天就要被取代了。但我觉得这种焦虑是没有必要的。',
    contextCurrent: '我们总是高估技术在短期内的影响，而低估它在长期内的影响。AI 不会在明天改变一切，但十年后回头看，一切都会不同。',
    contextAfter: '所以，不要焦虑，但也不要掉以轻心。保持对新技术的好奇心，持续学习，持续适应。',
    thought: '保持耐心，但要持续行动',
    podcastName: '跨国串门儿计划',
    episodeName: '#418. AI 时代的工业革命镜像',
    episodeId: '1',
  },
];

export const mockTranscript = `大家好，欢迎来到这一期的节目。今天我们要聊一个非常有意思的话题：AI 时代和工业革命时代的相似性。

很多人都在讨论人工智能会如何改变世界，但很少有人注意到，历史上其实已经发生过类似的技术革命。工业革命初期，工人的生活水平反而下降了，这种阵痛期持续了将近两代人。历史学家称之为"恩格斯停顿"，在技术进步的同时，普通人的福祉却在倒退。

这听起来很反直觉对吧？我们总认为技术进步应该让所有人受益，但现实往往更加复杂。新技术的引入会摧毁旧的工作岗位，创造新的工作岗位，但这个过渡期可能会很漫长。

技术的进步不会自动带来平等，反而可能加剧不平等。掌握新技术的人会获得巨大优势，而无法适应的人会被远远甩在后面。这就是为什么教育如此重要。

那么对于我们个人来说，应该如何应对这样的变化呢？我觉得最重要的是保持学习能力和适应能力。我们总是高估技术在短期内的影响，而低估它在长期内的影响。AI 不会在明天改变一切，但十年后回头看，一切都会不同。

所以，不要焦虑，但也不要掉以轻心。保持对新技术的好奇心，持续学习，持续适应。这可能是我们这一代人最重要的能力。

好了，今天的节目就到这里。感谢大家的收听，我们下期再见。`;
