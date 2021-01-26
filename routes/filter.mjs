export default class Filter {

        add (args, msg, Redis) {
            Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
                if ( err ) throw new Error(err);
                let filters = reply == null ? {} : JSON.parse(reply); 
                filters[args[0]] = args[2];
                Redis.set(`${msg.guild.name}/filters`, JSON.stringify(filters), (err, res) => { if (err) throw new Error(err); })
            }); msg.channel.send(`\`Add filter ${ args[0] } => ${ args[2] }\``)
        }

        edit (args, msg, Redis) {
            Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
                if ( err ) throw new Error(err);
                let filters = reply == null ? {} : JSON.parse(reply); 
                filters[args[0]] = args[2];
                Redis.set(`${msg.guild.name}/filters`, JSON.stringify(filters), (err, res) => { if (err) throw new Error(err); })
            }); msg.channel.send(`\`Edit filter ${ args[0] } => ${ args[2] }\``)
        }

        remove (args, msg, Redis) {
            Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
                if ( err ) throw new Error(err);
                let filters = reply == null ? {} : JSON.parse(reply); 
                filters[args[0]] = undefined;
                Redis.set(`${msg.guild.name}/filters`, JSON.stringify(filters), (err, res) => { if (err) throw new Error(err); })
            }); msg.channel.send(`\`Remove filter ${ args[0] }\``)
        }

        list (args, msg, Redis) {
            Redis.get(`${msg.guild.name}/filters` , function(err, reply) {
                let res = ""
                if ( err ) throw new Error(err);
                let filters = reply == null ? {} : JSON.parse(reply); 
                for ( let i in filters ) res += i + ' => ' + filters[i] + '\n';
                msg.channel.send(`\`\`\`${ res }\`\`\``)
            })
        }
}