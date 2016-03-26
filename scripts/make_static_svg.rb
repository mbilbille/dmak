#!/usr/bin/env ruby
# coding: utf-8

require 'json'
require 'sqlite3'
require 'open-uri'

if ARGV.length < 1 then
puts <<EOF
Export the database into a directory of .html files containing json,
that can be loaded via the hidden-iframe trick. Creates a (read-only)
data set that can be used locally (no web server, nor php necessary,
and allows for instance to use KanJax in Anki's cards.

Usage: #{File.basename($0)} target_dirctory
EOF
exit
end

pre = %q[<script language="JavaScript" type="text/javascript">
window.parent.postMessage(]
post = %q[, "*");
</script>
]

Dir.glob("#{ARGV[0]}/*.svg") { |file|
    name = File.basename(file).sub(/\.svg$/,'')
    data = File.read(file)
    
    hash = { "status" => "OK", "name" => name, "data" => data }
    text = pre + JSON.generate(hash) + post
    File.write(file+'.html', text);
}
