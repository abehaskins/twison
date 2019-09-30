var Twison = {
  extractLinkFromText: function(line) {
    console.log("checking:", line);
    if (!line || !line.startsWith("[[")) {
      return;
    }

    line = line.substring(2, line.length-2);

    var text, link, split, long_text, short_text;

    if ((split = line.split("|")).length > 1) {
      console.log("got a split", split, line);
      text = split[0]
      link = split[1]
    } else {
      text = line;
      link = line;
    }

    console.log(text, link, line);

    if ((split = text.split(":")).length > 1) {
      short_text = split[0];
      long_text = split[1];
    } else {
      short_text = text;
      long_text = text;
    }

    return {
      short_text: short_text.split("-&gt;")[0],
      long_text: long_text.split("-&gt;")[0],
      link: link.split("-&gt;")[1]
    }
  },

  convertPassage: function(passage) {
    var dict = {
      text: [],
      links: []
    };
    var cmd = /-\s?(.+)/g;
    var line;

    while (line = cmd.exec(passage.innerHTML)) {
      console.log("line", line);
      line = line[1];
      if (!line) return;

      var line_link = Twison.extractLinkFromText(line);

      if (line_link) {
        dict.links.push(line_link);
      } else {
        dict.text.push(line);
      }
    }
    console.log(dict);

    ["name", "pid", "position", "tags"].forEach(function(attr) {
      var value = passage.attributes[attr].value;
      if (value) {
        dict[attr] = value;
      }
    });

    if(dict.position) {
      var position = dict.position.split(',')
      dict.position = {
        x: position[0],
        y: position[1]
      }
    }

    if (dict.tags) {
      dict.tags = dict.tags.split(" ");
    }

    return dict;
	},

  convertStory: function(story) {
    var passages = story.getElementsByTagName("tw-passagedata");
    var convertedPassages = Array.prototype.slice.call(passages).map(Twison.convertPassage);

    var dict = {
      passages: convertedPassages
    };

    ["name", "startnode", "creator", "creator-version", "ifid"].forEach(function(attr) {
      var value = story.attributes[attr].value;
      if (value) {
        dict[attr] = value;
      }
    });

    // Add PIDs to links
    var pidsByName = {};
    dict.passages.forEach(function(passage) {
      pidsByName[passage.name] = passage.pid;
    });

    dict.passages.forEach(function(passage) {
      if (!passage.links) return;
      passage.links.forEach(function(link) {
        link.pid = pidsByName[link.link];
        if (!link.pid) {
          link.broken = true;
        }
      });
    });

    return dict;
  },

  convert: function() {
    var storyData = document.getElementsByTagName("tw-storydata")[0];
    var json = JSON.stringify(Twison.convertStory(storyData), null, 2);
    document.getElementById("output").innerHTML = json;
  }
}

window.Twison = Twison;
