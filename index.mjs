import fs, { mkdirSync } from 'fs'
import env from 'dotenv'
import { Client } from 'discord.js'
import { createClient } from 'redis'
import fetch from 'node-fetch'
import fxp from 'fast-xml-parser'
import { XmlEntities } from 'html-entities'

const Discord = new Client(),
      Redis = createClient({ host : "redis" }),
      Ent = new XmlEntities()

env.config()
      
const FEEDS_REFRESH = 1 // minutes
const CLIENT_ID = process.env.CLIENT_ID
const HELP = fs.readFileSync('README.md', {encoding:'utf8', flag:'r'})
const PROVERBS = fs.readFileSync('proverbs.txt', {encoding:'utf8', flag:'r'}).split('\n')

var UP = new Date()
Map.prototype.get_channel = function ( name ) {
    for ( let el of this ) {
        if ( el[1].name == name  ) return el[1];
    } ; return null
}

const rng = (min, max) => Math.floor(Math.random() * 1000 * max)%max + min
const fd_parser = (data, fd) => {
    try {
        var d = {}
        if ( Object.keys(data) == "rdf:RDF" ) {
            d.title = data["rdf:RDF"].channel.title
            d.item = data["rdf:RDF"].item
        } else {
            d.title = data.rss.channel.title
            d.item = data.rss.channel.item
        } return d
    } catch (e) { console.error(e, fd, data) }
}
const fds = () => {
    try {
        for ( let guild of Discord.guilds.cache ) {
            Redis.get(`${guild[1].name}/feeds` , function(err, reply) {
                if ( err ) throw new Error(err);
                let fds = reply == null ? {} : JSON.parse(reply);
                for ( let i = 0 ; i < fds.feeds.length ; i++ ) {
                    fetch(fds.feeds[i])
                        .then(res => res.text())
                        .then(body => {
                            if ( body ) {
                                var data = fd_parser(fxp.parse(body, {}), fds.feeds[i])
                                for ( let j = 0 ; j < data.item.length ; j++ )
                                if ( new Date(data.item[j].pubDate) > UP )
                                for ( let x = 0 ; x < fds.channels.length ; x++ )
                                guild[1].channels.cache.get_channel(fds.channels[x]).messages.channel
                                .send(`☄️  **${ data.title }  |  ${ Ent.decode(data.item[j].title) }**\n\n${ data.item[j].link }`)
                            }
                        })
                }
            });
        } UP = new Date()
    } catch (e) { console.error(e, data) }
}
const filter = {
    add : (args, msg) => {
        Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
            if ( err ) throw new Error(err);
            let filters = reply == null ? {} : JSON.parse(reply); 
            filters[args[0]] = args[2];
            Redis.set(`${msg.guild.name}/filters`, JSON.stringify(filters), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Add filter ${ args[0] } => ${ args[2] }\``)
    },
    edit : (args, msg) => {
        Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
            if ( err ) throw new Error(err);
            let filters = reply == null ? {} : JSON.parse(reply); 
            filters[args[0]] = args[2];
            Redis.set(`${msg.guild.name}/filters`, JSON.stringify(filters), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Edit filter ${ args[0] } => ${ args[2] }\``)
    },
    remove : (args, msg) => {
        Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
            if ( err ) throw new Error(err);
            let filters = reply == null ? {} : JSON.parse(reply); 
            filters[args[0]] = undefined;
            Redis.set(`${msg.guild.name}/filters`, JSON.stringify(filters), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Remove filter ${ args[0] }\``)
    },
    list : (args, msg) => {
        Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
            let res = ""
            if ( err ) throw new Error(err);
            let filters = reply == null ? {} : JSON.parse(reply); 
            for ( let i in filters ) res += i + ' => ' + filters[i] + '\n';
            msg.channel.send(`\`\`\`${ res }\`\`\``)
        })
    }
}
const markov = {
    add : () => {

    },
    get : () => {

    }
}

const feeds = {
    add : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            if ( args[0] != null ) fds.feeds.push(args[0]);
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Adding feed ${ args[0] }\``)
    },
    rm : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            for ( let i = 0 ; i < fds.feeds.length; i++ ) if ( args[0] == fds.feeds[i] ) {
                fds.feeds.splice(i, 1); }
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Feed ${ args[0] } removed.\``)
    },
    channel_add : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            if ( args[0] != null ) fds.channels.push(args[0]);
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Adding channel ${ args[0] }\``)
    },
    channel_rm : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            for ( let i = 0 ; i < fds.channels.length; i++ ) if ( args[0] == fds.channels[i] ) {
                fds.channels.splice(i, 1); }
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Channel ${ args[0] } removed.\``)
    },
    list : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            let res = ""
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            for ( let i = 0 ; i < fds.feeds.length; i++ ) res += fds.feeds[i] + '\n';
            msg.channel.send(`\`\`\`${ res }\`\`\``)
        })
    },
    list_channels : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            let res = ""
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            for ( let i = 0 ; i < fds.channels.length; i++ ) res += fds.channels[i] + '\n';
            msg.channel.send(`\`\`\`${ res }\`\`\``)
        })
    },
    refresh : ( args, msg ) => {
        fds(); msg.channel.send('`Feeds successfully pulled !`')
    }
}

const citations = {
    add : ( args, msg ) =>  {

    },
    rm : ( args, msg ) =>  {

    },
    list : ( args, msg ) =>  {

    },
    random : ( args, msg ) => {

    }
}

function parse (msg) {
    try { 
        if ( msg.author.bot ) return;
        switch ( msg.content.split(' ')[0] ) {
            case '!filter' :
                var method = msg.content.split(' '), content = msg.content.split('"')
                if ( filter[method[1]] == undefined ) throw new Error('Invalid command');
                filter[method[1]]( content.splice(1), msg ); break;
            case '!feed' :
                var method = msg.content.split(' '), content = msg.content.split('"')
                if ( feeds[method[1]] == undefined ) throw new Error('Invalid command');
                feeds[method[1]]( content.splice(1), msg ); break;
            case '!citation' :
                var method = msg.content.split(' '), content = msg.content.split('"')
                if ( citations[method[1]] == undefined ) throw new Error('Invalid command');
                citations[method[1]]( content.splice(1), msg ); break;
            case '!proverb' :
                msg.channel.send(`\`${PROVERBS[rng(0, PROVERBS.length)]}\``); break;
            case '!nofilter' :
                break;
            case '!help':
                msg.channel.send(HELP); break;
            default :
                markov.add(msg.content)
                Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
                    if ( err ) throw new Error(err);
                    let base = msg.content,
                        rep = false,
                        filters = reply == null ? {} : JSON.parse(reply); 
                    for ( let i in filters ) {
                        let tmp = new RegExp(i, 'gi')
                        if ( base.match(tmp) != null ) {
                            rep = true
                            base = base.replace(tmp, filters[i]);
                        }
                    }
                    if (rep) {
                        msg.channel.send('<@!' + msg.author.id + '> : ' + base)
                        msg.delete()
                    }
                });
                if ( msg.mentions.users.find(el => process.env.NAME == el.username) ) msg.channel.send(markov.get());
                break;
        }
    } catch ( e ) { 
        console.error(e);
        msg.channel.send(`\`❌ I can\'t do this !\``) }
}

Discord.on('ready', () => {
    console.log(`Logged in as ${Discord.user.tag}!`)
    //console.log(Discord.guilds.cache)
    Discord.user.setActivity({
        type : "WATCHING",
        name : 'Shoujo\'s',
        startTimestamp : Date.now(),
        largeImageKey : "s-l640",
        smallImageKey : "small_yuuko"
    }); fds()
    setInterval(() => fds(), 60000 * FEEDS_REFRESH)
})

Discord.on('message', msg => parse (msg))
Discord.login(process.env.TOKEN)