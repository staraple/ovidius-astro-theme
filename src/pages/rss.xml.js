import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import siteConfig from '../data/site-config.ts';
import { filterOutDrafts, sortPostsByDateDesc } from '../utils/post-utils';

export async function GET(context) {
    const posts = (await getCollection('blog')).sort(sortPostsByDateDesc).filter(filterOutDrafts);
    return rss({
        title: siteConfig.title,
        description: siteConfig.description,
        site: context.site,
        items: posts.map((item) => ({
            title: item.data.title,
            description: item.data.excerpt,
            link: `/posts/${item.id}/`,
            pubDate: item.data.publishDate.setUTCHours(0)
        }))
    });
}
