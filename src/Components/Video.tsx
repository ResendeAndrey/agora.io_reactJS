import React, { useState } from "react";
import AgoraRTC from "agora-rtc-sdk";

import "../styles.css";

const Video = () => {
  const [type, setType] = useState("");
  const [formData, setFormData] = useState({
    appId: "",
    channelName: "",
    token: "",
    type: "" as "audience" | "host"
  });
  const [active, setActive] = useState(false);

  const onChange = (event: any) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  let client = AgoraRTC.createClient({
    mode: "live",
    codec: "vp8"
  });

  const onSubmit = (e: any) => {
    e.preventDefault();

    const handleError = (error: any) => {
      console.log("handleError", { error });
    };

    if (!formData.appId || !formData.token || !formData.channelName) {
      alert("Please provide a TOKEN, APP ID and CHANNEL NAME");
      return;
    }
    if (formData.type === "host") {
      client.init(formData.appId);
      client.setClientRole(formData.type); // @TODO
      client.join(
        formData.token,
        formData.channelName,
        null,
        (uid) => {
          // Create a local stream
          let localStream = AgoraRTC.createStream({
            audio: true,
            video: true
          });
          // Initialize the local stream
          localStream.init(() => {
            // Play the local stream
            localStream.play("livestream");
            // Publish the local stream
            client.publish(localStream, handleError);
          }, handleError);

          setActive(true);
        },
        handleError
      );
    } else if (formData.type === "audience") {
      client.init(
        formData.appId,
        function () {
          console.log("AgoraRTC client initialized");
          joinChannel(); // join channel upon successfull init
        },
        function (err) {
          console.log("[ERROR] : AgoraRTC client init failed", err);
        }
      );
    }
  };

  function joinChannel() {
    client.setClientRole("audience", function () {
      console.log("Client role set to audience");
    });

    client.join(
      formData.token,
      formData.channelName,
      0,
      function (uid) {
        console.log("User " + uid + " join channel successfully");
      },
      function (err) {
        console.log("[ERROR] : join channel failed", err);
      }
    );
  }

  client.on("stream-added", function (evt) {
    var stream = evt.stream;
    var streamId = stream.getId();
    console.log("New stream added: " + streamId);
    console.log("Subscribing to remote stream:" + streamId);
    // Subscribe to the stream.
    client.subscribe(stream, function (err) {
      console.log("[ERROR] : subscribe stream failed", err);
    });
  });

  client.on("stream-removed", function (evt) {
    var stream = evt.stream;
    stream.stop(); // stop the stream
    stream.close(); // clean up and close the camera stream
    console.log("Remote stream is removed " + stream.getId());
  });

  client.on("stream-subscribed", function (evt) {
    var remoteStream = evt.stream;
    remoteStream.play("livestream");
    setActive(true);
    console.log(
      "Successfully subscribed to remote stream: " + remoteStream.getId()
    );
  });

  function leaveChannel() {
    client.leave(
      function () {
        console.log("client leaves channel");
      },
      function (err) {
        console.log("client leave failed ", err); //error handling
      }
    );
  }
  client.on("stream-removed", function (evt) {
    var stream = evt.stream;
    stream.stop(); // stop the stream
    stream.close(); // clean up and close the camera stream
    console.log("Remote stream is removed " + stream.getId());
  });

  // remove the remote-container when a user leaves the channel
  client.on("peer-leave", function (evt) {
    var stream = evt.stream;
    console.log("Remote stream has left the channel: " + evt.uid);
    stream.stop(); // stop the stream
  });

  // show mute icon whenever a remote has muted their mic
  client.on("mute-audio", function (evt) {
    var remoteId = evt.uid;
  });

  client.on("unmute-audio", function (evt) {
    var remoteId = evt.uid;
  });

  // show user icon whenever a remote has disabled their video
  client.on("mute-video", function (evt) {
    var remoteId = evt.uid;
  });

  client.on("unmute-video", function (evt) {
    var remoteId = evt.uid;
  });

  return (
    <div>
      <div>
        <form onSubmit={onSubmit}>
          <fieldset>
            <legend>AUTHENTICATION</legend>
            <label htmlFor="appId">APP ID</label>
            <br />
            <input
              type="text"
              name="appId"
              id="appId"
              onChange={onChange}
              defaultValue={formData.appId}
              style={{ width: 400 }}
              required
            />
            <br />
            <br />
            <label htmlFor="channelName">CHANNEL NAME</label>
            <br />
            <input
              type="text"
              name="channelName"
              id="channelName"
              onChange={onChange}
              defaultValue={formData.channelName}
              style={{ width: 400 }}
              required
            />
            <br />
            <br />
            <label htmlFor="token">TOKEN</label>
            <br />
            <input
              type="text"
              name="token"
              id="token"
              onChange={onChange}
              defaultValue={formData.token}
              style={{ width: 400 }}
              required
            />
            <br />
            <br />
            <button
              type="submit"
              onClick={() => setFormData({ ...formData, type: "host" })}
            >
              Acessar as Host
            </button>
            <button
              type="submit"
              onClick={() => setFormData({ ...formData, type: "audience" })}
            >
              Acessar as Audience
            </button>
          </fieldset>
        </form>
      </div>
      {!active ? (
        <p>
          Please insert the <code>appId</code>, <code>channelName</code>,{" "}
          <code>type</code> and <code>token</code> as URL parameters.
        </p>
      ) : (
        <div id="livestream"></div>
      )}

      <div id="livestream"></div>
    </div>
  );
};

export default Video;
