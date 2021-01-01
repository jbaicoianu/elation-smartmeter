{dependency name="html.jszip"}
{dependency name="ui.droptarget"}
{dependency name="ui.select"}
{dependency name="smartmeter.d3"}
{dependency name="smartmeter.graph"}

<div data-elation-component="smartmeter.graph" data-elation-args.graphtype="{$graphtype}">
  <data class="elation-args" name="graphtype">{$graphtype}</data>
  <data class="elation-args" name="intervals">{jsonencode var=$intervals}</data>
</div>
{set var="page.title"}Smartmeter electricity usage graphs{/set}
