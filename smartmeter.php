<?php

class Component_smartmeter extends Component {
  public function init() {
    OrmManager::LoadModel("smartmeter");
  }

  public function controller_smartmeter($args) {
    $vars = array();
    $vars["intervals"] = array(
      "electric" => $this->getintervals("components/smartmeter/data/electric.xml"),
      "gas" => $this->getintervals("components/smartmeter/data/gas.xml"),
    );

    return $this->GetComponentResponse("./smartmeter.tpl", $vars);
  }
  public function controller_weather($args) {
    if (!empty($args["date"]) && !empty($args["location"])) {
      $weather = $this->getweather($args["date"], $args["location"]);
      $vars["intervals"] = array();
      if (!empty($weather->history->observations)) {
        foreach ($weather->history->observations as $obs) {
          $obj = array(
            "start" => mktime($obs->utcdate->hour, $obs->utcdate->min, 0, $obs->utcdate->mon, $obs->utcdate->mday, $obs->utcdate->year),
            "value" => (float)$obs->tempi
          );
          array_push($vars["intervals"], $obj);
        }
      }
    }
    return $this->GetComponentResponse("./weather.tpl", $vars);
  }


  public function getintervals($fname) {
    $xmldata = simplexml_load_file($fname);
    $intervals = array();
    foreach ($xmldata->entry as $k=>$entry) {
      if (!empty($entry->content->IntervalBlock)) {
        foreach ($entry->content->IntervalBlock->IntervalReading as $interval) {
          $obj = array(
            "start" => (int) $interval->timePeriod->start,
            "duration" => (int) $interval->timePeriod->duration,
            "value" => (float) $interval->value,
            "cost" => (float) $interval->cost / 100000,
          );
          $obj["end"] = $obj["start"] + $obj["duration"];
          $obj["costpersecond"] = $obj["cost"] / $obj["duration"];
          $obj["costperminute"] = $obj["costpersecond"] * 60;
          $obj["costperhour"] = $obj["costperminute"] * 60;
          $obj["costperday"] = $obj["costperhour"] * 24;
          array_push($intervals, $obj);
        }
      }
    }
    return $intervals;
  }
  public function getweather($date, $location) {
    $apikey = "0e1afa84a2430ecc";
    $url = sprintf("http://api.wunderground.com/api/%s/history_%d/q/%s.json", $apikey, $date, $location);

    $cachedir = "components/smartmeter/data/weather/$location/";
    $cachefile = $date . ".json";

    if (file_exists($cachedir . $cachefile)) {
      $json = file_get_contents($cachedir . $cachefile);
    } else {
      if (!(file_exists($cachedir) && is_dir($cachedir))) {
        mkdir($cachedir, 0777, true);
      }
      $json = file_get_contents($url);
      file_put_contents($cachedir . $cachefile, $json);
    }
    return json_decode($json);
  }
}  
