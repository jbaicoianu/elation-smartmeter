{dependency name="html.jszip"}
{dependency name="ui.droptarget"}
{dependency name="ui.select"}
{dependency name="smartmeter.d3"}
{dependency name="smartmeter.graph"}

<div elation:component="smartmeter.graph" elation:args.graphtype="{$graphtype}">
  <elation:args name="intervals">{jsonencode var=$intervals}</elation:args>
</div>
{set var="page.title"}Smartmeter electricity usage graphs{/set}
