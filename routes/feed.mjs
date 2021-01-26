import fetch from 'node-fetch'

Map.prototype.get_channel = function ( name ) {
    for ( let el of this ) {
        if ( el[1].name == name  ) return el[1];
    } ; return null
}

export default class Feeds {
    constructor () { this.date = new Date() }

    fd_parser (data, fd) {
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

    fds (Discord, Redis, Ent, fxp) {
        var data;
        try {
            for ( let guild of Discord.guilds.cache ) {
                Redis.get(`${guild[1].name}/feeds` , (err, reply) => {
                    if ( err ) throw new Error(err);
                    let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
                    for ( let i = 0 ; i < fds.feeds.length ; i++ ) {
                        fetch(fds.feeds[i])
                            .then(res => res.text())
                            .then(body => {
                                if ( body ) {
                                    data = this.fd_parser(fxp.parse(body, {}), fds.feeds[i])
                                    for ( let j = 0 ; j < data.item.length ; j++ )
                                    if ( new Date(data.item[j].pubDate) > this.date )
                                        for ( let x = 0 ; x < fds.channels.length ; x++ )
                                            guild[1].channels.cache.get_channel(fds.channels[x]).messages.channel
                                                .send(`☄️  **${ data.title }  |  ${ Ent.decode(data.item[j].title) }**\n\n${ data.item[j].link }`)
                                }
                            })
                    }
                });
            } this.date = new Date()
        } catch (e) { 
            if (data) console.error(data);
            console.error(e)
        }
    }

    add ( args, msg, Redis, fxp )  {
            // Verif feed
            fetch(args[0])
                .then(res => res.text())
                .then(body => {
                    this.fd_parser(fxp.parse(body, {}), args[0])
                    Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
                        if ( err ) throw new Error(err);
                        let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
                        if ( args[0] != null ) fds.feeds.push(args[0]);
                        Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
                    }); msg.channel.send(`\`Adding feed ${ args[0] }\``)
                })
                .catch(err => {
                    console.error(err)
                    msg.channel.send(`\`❌ Incorrect feed format\``)
                })
    }

    rm ( args, msg, Redis )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            for ( let i = 0 ; i < fds.feeds.length; i++ ) if ( args[0] == fds.feeds[i] ) {
                fds.feeds.splice(i, 1); }
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Feed ${ args[0] } removed.\``)
    }

    channel_add ( args, msg, Redis )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            if ( args[0] != null ) fds.channels.push(args[0]);
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Adding channel ${ args[0] }\``)
    }

    channel_rm ( args, msg )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            for ( let i = 0 ; i < fds.channels.length; i++ ) if ( args[0] == fds.channels[i] ) {
                fds.channels.splice(i, 1); }
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Channel ${ args[0] } removed.\``)
    }

    list ( args, msg, Redis )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            let res = ""
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            for ( let i = 0 ; i < fds.feeds.length; i++ ) res += fds.feeds[i] + '\n';
            msg.channel.send(`\`\`\`${ res }\`\`\``)
        })
    }

    list_channels ( args, msg, Redis )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            let res = ""
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            for ( let i = 0 ; i < fds.channels.length; i++ ) res += fds.channels[i] + '\n';
            msg.channel.send(`\`\`\`${ res }\`\`\``)
        })
    }
}