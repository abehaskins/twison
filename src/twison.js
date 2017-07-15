var Twison = {
  extractLinksFromText: function(text) {
    var links = text.match(/\[\[.+?\]\]/g)
    if (links) {
      return links.map(function(link) {
        var differentName = link.match(/\[\[(.*?)\|(.*?)\]\]/);
        var text, link;

        if (differentName) {
          text = differentName[1]
          link = differentName[2]
        } else {
          text = link
        }

        link = link.substring(2, link.length-2)
        var long_text, short_text;

        if (link.split(":").length > 1) {
            short_text = link.split(":")[0];
            long_text = link.split(":")[1];
        } else {
          short_text = link;
          long_text = link;
        }

        return {
          short_text: short_text,
          long_text: long_text,
          link: link
        }
      });
    }
  },

  convertPassage: function(passage) {
  	var dict = {text: passage.innerHTML.split("-").map(function (line) {
      return line.trim();
    })};

    var links = [];

    dict.text.forEach(function (line) {
      if (!line) return;

      var line_links = Twison.extractLinksFromText(line);
      console.log(line_links);
      links = links.concat(line_links);
    });

    Object.keys(dict.text).forEach(function (key) {
      if (!dict.text[key]) delete dict.text[key];
    });

    console.log(links, dict);

    if (links) {
      dict.links = links;
    }

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
