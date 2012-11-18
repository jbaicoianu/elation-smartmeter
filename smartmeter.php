<?php

class Component_smartmeter extends Component {
  public function init() {
    OrmManager::LoadModel("smartmeter");
  }

  public function controller_smartmeter($args) {
    $vars = array();
    $fuh = simplexml_load_file("components/smartmeter/data/electric.xml");
    $vars["intervals"] = array();
    foreach ($fuh->entry as $k=>$entry) {
      if (!empty($entry->content->IntervalBlock)) {
        foreach ($entry->content->IntervalBlock->IntervalReading as $interval) {
          $obj = array(
            "start" => (int) $interval->timePeriod->start,
            "duration" => (int) $interval->timePeriod->duration,
            "value" => (float) $interval->value
          );
          $obj["end"] = $obj["start"] + $obj["duration"];
          array_push($vars["intervals"], $obj);
        }
      }
    }
    return $this->GetComponentResponse("./smartmeter.tpl", $vars);
  }
}  
