require('dotenv').config();
const config = require('./config.js');
const { Client, Intents, MessageEmbed } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const CHANNEL_ID = process.env.CHANNEL_ID;
const colors = ['#ff0000', '#00ff00', '#0000ff'];
const urls = config.urls;
const sentArticles = [];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  const channel = client.channels.cache.get(CHANNEL_ID);
  setInterval(() => {
    Promise.all(urls.map(url => {
      console.log(`Fetching data from ${url}`);
      return axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    }))
    .then(responses => {
      responses.forEach(response => {
        const $ = cheerio.load(response.data);
        $('article.node--type-article').each((i, element) => {
          const id = $(element).attr('data-history-node-id');
          if (!sentArticles.includes(id)) {
            const title = $(element).find('h2').text();
            const url = $(element).find('a').attr('href');
            const description = $(element).find('.field--name-field-summary').text();
            const imageUrl = $(element).find('img').attr('src');
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const embed = new MessageEmbed()
              .setTitle(title)
              .setURL(url)
              .setDescription(description)
              .setImage(imageUrl)
              .setColor(randomColor)
              .setTimestamp();
            channel.send(embed);
            sentArticles.push(id);
          }
        });
      });
    })
    .catch(error => {
      console.error(`Error fetching data from ${error.config.url}: ${error.message}`);
    });
  }, 40000);
});

client.login(process.env.DISCORD_TOKEN);