module.exports = function (RED) {
    "use strict"
    const SurePet = require('sure-pet-care-client');

    function SurePetNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.surepet = RED.nodes.getNode(config.surepet);

        node.on('input', function (msg) {

            // special case, if `topic` === connect, then re-authenticate
            if (msg.topic === "connect") {
                node.surepet.client = new SurePet.SurePetCareClient();
                node.surepet.client.authenticate(msg.username || msg.payload?.username, msg.password || msg.payload?.password)
                .then(() => node.status({ fill: "green", shape: "dot", text: "Connected." }))
                .catch(err => {
                    node.error(err, msg)
                    node.status({ fill: "red", shape: "ring", text: err })
                })
                return
            }

            // normal operation
            if (config.mode === 'list_pets') {
                node.surepet.client.getPets().then((pets) => {
                    msg.payload = {
                        pets: pets
                    }
                    node.send(msg)
                }).catch((err) => {
                    node.error(err, msg);
                })
            } else if (config.mode === "get_status") {
                node.surepet.client.getState().then((state) => {
                    msg.payload = state;
                    node.send(msg);
                }).catch((err) => {
                    node.error(err, msg);
                })
            } 
        });
    }
    RED.nodes.registerType("surepet", SurePetNode);

    function SurePetCredentials(n) {
        RED.nodes.createNode(this, n);
        const node = this
        node.username = n.username || node.credentials.username;
        node.password = n.password || node.credentials.password;
        node.client = new SurePet.SurePetCareClient();
        if (node.username && node.password) {
            node.log("We have a username and password, attempting to authenticate.")
            node.client.authenticate(node.username, node.password)
                .then(() => node.status({ fill: "green", shape: "dot", text: "Connected." }))
                .catch(err => {
                    node.status({ fill: "red", shape: "ring", text: err })
                    node.error(err)
                })
        }
    }

    RED.nodes.registerType("surepet-credentials", SurePetCredentials, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" }
        }
    });
}
