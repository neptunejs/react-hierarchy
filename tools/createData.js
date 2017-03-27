import {stratify} from 'd3-hierarchy';
import euclideanDistance from 'ml-distance-euclidean';
import distanceMatrix from 'ml-distance-matrix';

export default function createData(n = 10) {

    let start = 0;
    let date = Date.now();

    const data = [];
    for (var i = 0; i < n; i++) {
        data.push({
            name: String.fromCharCode(start),
            time: date,
            value: getRandomData()
        });
        start++;
        date += 1000 * 60 * 60 * (Math.ceil(Math.random() * 500));
    }

    const distance = distanceMatrix(data.map(el => el.value), euclideanDistance);

    const hierarchy = stratify()
        .id(el => el.name)
        .parentId(getParentId)
        (data);

    return hierarchy;

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
