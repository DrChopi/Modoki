import fs, { mkdirSync } from 'fs'
import env from 'dotenv'
import { Client } from 'discord.js'
import { createClient } from 'redis'

const Discord = new Client(),
      Redis = createClient({ host : "redis" })

env.config()
      
const FEEDS_REFRESH = 10 // minutes
const CLIENT_ID = process.env.CLIENT_ID
const HELP = fs.readFileSync('README.md', {encoding:'utf8', flag:'r'})
const PROVERBS = fs.readFileSync('proverbs.txt', {encoding:'utf8', flag:'r'}).split('\n')

const rng = (min, max) => Math.floor(Math.random() * 1000 * max)%max + min
const fds = () => {
    console.log("Fetch feeds")
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

const feeds = {
    add : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            fds.feeds.push(args[0]);
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Adding feed ${ args[0] }\``)
    },
    rm : ( args, msg ) =>  {

    },
    channel_add : ( args, msg ) =>  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            fds.channels.push(args[0]);
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Adding channel ${ args[0] }\``)
    },
    channel_rm : ( args, msg ) =>  {

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
                if ( msg.mentions.users.find(el => process.env.NAME == el.username) ) msg.channel.send('Random message');
                break;
        }
    } catch ( e ) { 
        console.error(e);
        msg.channel.send(`\`❌ I can\'t do this !\``) }
}

Discord.on('ready', () => {
    console.log(`Logged in as ${Discord.user.tag}!`)
    Discord.user.setActivity({
        type : "WATCHING",
        name : 'Shoujo\'s',
        startTimestamp : Date.now(),
        largeImageKey : "s-l640",
        smallImageKey : "small_yuuko"
    });
    setInterval(() => fds(), 60000 * FEEDS_REFRESH)
})

Discord.on('message', msg => parse (msg))
Discord.login(process.env.TOKEN)