import { stratify } from 'd3-hierarchy';
import euclideanDistance from 'ml-distance-euclidean';
import distanceMatrix from 'ml-distance-matrix';

import fixedData from './data.json';

export default function createData(n = 10) {

  let data, distance;

  if (n === 0) {
    data = fixedData.data;
    distance = fixedData.distance;
  } else {
    let date = Date.now();

    data = [];
    for (var i = 0; i < n; i++) {
      data.push({
        name: `${i}`,
        time: date,
        value: getRandomData()
      });
      date += 1000 * 60 * 60 * (Math.ceil(Math.random() * 500));
    }

    distance = distanceMatrix(data.map((el) => el.value), euclideanDistance);
  }

  return stratify()
    .id((el) => el.name)
    .parentId(getParentId)(data);

  function getParentId(el, idx, data) {
    if (idx === 0) return null;
    const dist = distance[idx];
    var min = Infinity;
    var minIdx = 0;
    for (var i = idx - 1; i >= 0; i--) {
      if (dist[i] < min) {
        min = dist[i];
        minIdx = i;
      }
    }
    return data[minIdx].name;
  }
}

function getRandomData() {
  const data = [];
  for (var i = 0; i < 5; i++) {
    data.push(Math.random());
  }
  return data;
}
