export type Image = {
    src: string;
    alt?: string;
};

export type Link = {
    href: string;
    text: string;
};

export type SocialLink = Link & {
    icon: 'bluesky' | 'codepen' | 'dev' | 'facebook' | 'github' | 'instagram' | 'linkedin' | 'medium' | 'x-twitter';
};

export type Hero = {
    title?: string;
    text?: string;
    avatar?: Image;
    backgroundImage?: Image;
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    logo?: Image;
    title: string;
    description: string;
    image?: Image;
    primaryNavLinks?: Link[];
    secondaryNavLinks?: Link[];
    socialLinks?: SocialLink[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
};

const siteConfig: SiteConfig = {
    logo: {
        src: '/logo.svg',
        alt: 'Staraple logo'
    },
    title: 'Staraple',
    description: "Star's personal blog.",
    primaryNavLinks: [
        {
            text: '首页',
            href: '/'
        },
        {
            text: '文章',
            href: '/posts'
        },
        /*{
            text: '关于',
            href: '/about'
        },*/
        {
            text: '联系我',
            href: '/contact'
        }
    ],
    secondaryNavLinks: [
        /*{
            text: 'About',
            href: '/about'
        },
        {
            text: 'Terms of Service',
            href: '/terms'
        },
        {
            text: 'Contact',
            href: '/contact'
        },
        {
            text: 'Download Theme',
            href: 'https://github.com/JustGoodUI/ovidius-astro-theme'
        }*/
    ],
    socialLinks: [
        /*{
            text: 'Go to GitHub repo',
            href: 'https://github.com/JustGoodUI/ovidius-astro-theme',
            icon: 'github'
        },
        {
            text: 'Follow on Instagram',
            href: 'https://instagram.com/',
            icon: 'instagram'
        },
        {
            text: 'Follow on Bluesky',
            href: 'https://bsky.app/profile/justgoodui.com',
            icon: 'bluesky'
        }*/
    ],
    hero: {
        title: '你 好~',
        text: '我是一名前端工程师，现居上海',
        avatar: {
            src: '/avatar.jpg',
            alt: 'Staraple avatar'
        },
        backgroundImage: {
            src: '/hero.webp'
        }
    },
    subscribe: {
        title: 'Subscribe to Ovidius Newsletter',
        text: 'One update per week. All the latest news directly in your inbox.',
        formUrl: 'https://justgoodthemes.us3.list-manage.com/subscribe/post?u=78f1bab16028354caeb23aecd&amp;id=4a7330d117&amp;f_id=005c48e2f0'
    },
    postsPerPage: 7
};

export default siteConfig;
