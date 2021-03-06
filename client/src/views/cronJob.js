import React from 'react';
import Base from '../components/base';
import ContainersPanel from '../components/containersPanel';
import CpuChart from '../components/cpuChart';
import DeleteButton from '../components/deleteButton';
import EventsPanel from '../components/eventsPanel';
import Field from '../components/field';
import ItemHeader from '../components/itemHeader';
import Loading from '../components/loading';
import MetadataFields from '../components/metadataFields';
import PodsPanel from '../components/podsPanel';
import RamChart from '../components/ramChart';
import SaveButton from '../components/saveButton';
import api from '../services/api';
import {getPodMetrics} from '../utils/metricsHelpers';
import {filterByOwner} from '../utils/filterHelper';

const service = api.cronJob;

export default class CronJob extends Base {
    componentDidMount() {
        const {namespace, name} = this.props;

        this.registerApi({
            item: service.get(namespace, name, item => this.setState({item})),
            pods: api.pod.list(namespace, pods => this.setState({pods})),
            events: api.event.list(namespace, events => this.setState({events})),
            metrics: api.metrics.pods(namespace, metrics => this.setState({metrics})),
        });
    }

    render() {
        const {namespace, name} = this.props;
        const {item, pods, events, metrics} = this.state || {};

        const filteredPods = filterByOwner(pods, item);
        const filteredEvents = filterByOwner(events, item);
        const filteredMetrics = getPodMetrics(filteredPods, metrics);

        return (
            <div id='content'>
                <ItemHeader title={['Cron Job', namespace, name]} item={item}>
                    <>
                        <SaveButton
                            item={item}
                            onSave={x => service.put(x)}
                        />

                        <DeleteButton
                            onDelete={() => service.delete(namespace, name)}
                        />
                    </>
                </ItemHeader>

                <div className='charts'>
                    <div className='charts_item'>
                        <div>{(item && item.status.active) ? item.status.active.length : 0}</div>
                        <div className='charts_itemLabel'>Active</div>
                    </div>
                    <CpuChart items={filteredPods} metrics={filteredMetrics} />
                    <RamChart items={filteredPods} metrics={filteredMetrics} />
                </div>

                <div className='contentPanel'>
                    {!item ? <Loading /> : (
                        <div>
                            <MetadataFields item={item} />
                            <Field name='Schedule' value={item.spec.schedule} />
                            <Field name='Suspend' value={item.spec.suspend} />
                            <Field name='Last Scheduled' value={item.status.lastScheduleTime} />
                        </div>
                    )}
                </div>

                <ContainersPanel spec={item && item.spec.jobTemplate.spec.template.spec} />

                {/* TODO: this actually need to be a list of jobs */}
                <PodsPanel items={filteredPods} metrics={filteredMetrics} skipNamespace={true} />
                <EventsPanel shortList={true} items={filteredEvents} />
            </div>
        );
    }
}
