export default class Feeds {
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

    fds () {
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

    add ( args, msg )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            if ( args[0] != null ) fds.feeds.push(args[0]);
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Adding feed ${ args[0] }\``)
    }

    rm ( args, msg )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply);
            for ( let i = 0 ; i < fds.feeds.length; i++ ) if ( args[0] == fds.feeds[i] ) {
                fds.feeds.splice(i, 1); }
            Redis.set(`${msg.guild.name}/feeds`, JSON.stringify(fds), (err, res) => { if (err) throw new Error(err); })
        }); msg.channel.send(`\`Feed ${ args[0] } removed.\``)
    }

    channel_add ( args, msg )  {
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

    list ( args, msg )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            let res = ""
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            for ( let i = 0 ; i < fds.feeds.length; i++ ) res += fds.feeds[i] + '\n';
            msg.channel.send(`\`\`\`${ res }\`\`\``)
        })
    }

    list_channels ( args, msg )  {
        Redis.get(`${msg.guild.name}/feeds` , function(err, reply) {
            let res = ""
            if ( err ) throw new Error(err);
            let fds = reply == null ? { feeds : [], channels : [] } : JSON.parse(reply); 
            for ( let i = 0 ; i < fds.channels.length; i++ ) res += fds.channels[i] + '\n';
            msg.channel.send(`\`\`\`${ res }\`\`\``)
        })
    }

    refresh ( args, msg ) {
        fds(); msg.channel.send('`Feeds successfully pulled !`')
    }
}