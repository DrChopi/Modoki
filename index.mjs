import fs from 'fs'
import env from 'dotenv'
import didi, { Message } from 'discord.js'
import redis from 'redis'
import fetch from 'node-fetch'
import fxp from 'fast-xml-parser'
import het from 'html-entities'
import lib from './routes/_module.mjs'

// encapsulation import
const { XmlEntities } = het,
      { Client } = didi,
      { createClient } = redis,
      { mkdirSync } = fs

// init managers
const Discord = new Client(),
      Redis = createClient({ host : "redis" }),
      Ent = new XmlEntities()

// load envs
env.config()

// load config
const FEEDS_REFRESH = 1 // minutes
const CLIENT_ID = process.env.CLIENT_ID
const HELP = fs.readFileSync('README.md', {encoding:'utf8', flag:'r'})
const PROVERBS = fs.readFileSync('proverbs.txt', {encoding:'utf8', flag:'r'}).split('\n')

// Rich presence
Discord.on('ready', () => {
    console.log(`Logged in as ${Discord.user.tag}!`)
    //console.log(Discord.guilds.cache)
    Discord.user.setActivity({
        type : "WATCHING",
        name : 'Shoujo\'s',
        startTimestamp : Date.now(),
        largeImageKey : "s-l640",
        smallImageKey : "small_yuuko"
    }); //setInterval(() => fds(), 60000 * FEEDS_REFRESH)
})

Discord.on('message', async msg => {
    let err = [ `\`❌ I can\'t do this !\`` ]
    let prefix = await new Promise(resolve => {
        Redis.get(`${msg.guild.name}/prefix` , function(err, reply) {
            resolve(err || reply == null ? '!' : reply)
        })
    }) 
    
    if (msg.content[0] == prefix) {
        let extract = msg.content.split(' ')
        extract[0] = extract[0].substring(prefix.length)
        if (lib[extract[0]])
            msg.channel.send('ok')
        else
            msg.channel.send(err[0])
    } else {}

})

Discord.login(process.env.TOKEN)