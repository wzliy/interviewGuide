const { defaultTheme } = require('@vuepress/theme-default')
const { searchPlugin } = require('@vuepress/plugin-search')

module.exports = {
  lang: 'zh-CN',
  title: '面试指南',
  description: '面试指南',
  base: '/interviewGuide/',
  // 配置默认主题
  theme: defaultTheme({
    // 导航栏配置
    navbar: [
      {
        text: '首页',
        link: '/',
      },
      // NavbarGroup
      {
        text: '主题',
        children: ['/java/', '/redis/'],
      },
    ],
    // 仓库地址
    repo: 'https://github.com/wzliy/interviewGuide.git',
    editLink: false,
    lastUpdated: false,
    contributors: false,

    // 侧边栏设置
    sidebar: {
      '/': [
        {
          text: '首页',
          link: '/',
        },
        {
          text: 'Java',
          link: '/java/',
          children: [
            '/java/javaBasic.md',
            '/java/concurrent.md',
            '/java/JavaMultiThread.md',
          ]
        },
        {
          text: 'Redis',
          link: '/redis/',
        },
        {
          text: '消息队列',
          link: '/消息队列/',
          children: [
            '/消息队列/Kafka.md',
          ]
        },
      ],
    },

  }),
  plugins: [
    searchPlugin({
      // 配置项
      locales: {
        '/': {
          placeholder: 'Search',
        },
        '/zh/': {
          placeholder: '搜索',
        },
      },
    }),
  ],

}